import { describe, expect, it, vi } from "vitest";
import { readConfig } from "../src/config";
import { consumeBatch, deliverOutbox, runScheduledRepair } from "../src/consumer";
import { deliverEmail } from "../src/email";
import { getLeadById, storeLead } from "../src/leads";
import type { Env, MessageBatch, QueueMessage } from "../src/types";
import { createTestDatabase, leadDraft, seedLead, testEnv, type LeadDraft } from "./helpers";

const baseTime = Date.parse("2026-11-25T12:00:00.000Z");

async function seed(
  database: ReturnType<typeof createTestDatabase>,
  overrides: Partial<LeadDraft> = {},
  idempotencyKey = "seed-idempotency-key",
) {
  const result = await seedLead(database, overrides, idempotencyKey);
  if ("conflict" in result) throw new Error("seed conflict");
  return result;
}

function outbox(database: ReturnType<typeof createTestDatabase>, channel: "email" | "webhook") {
  return database.sqlite.prepare("SELECT * FROM outbox WHERE channel = ?").get(channel) as {
    id: string; status: string; attempt_count: number; next_attempt_at: string;
  };
}

function queueMessage(body: unknown): QueueMessage {
  return {
    id: "message-1",
    timestamp: new Date(baseTime),
    body,
    attempts: 1,
    ack: vi.fn(),
    retry: vi.fn(),
  };
}

describe("D1 transactional acceptance", () => {
  it("rolls back the idempotency row, lead and first outbox row if any insert fails", async () => {
    const database = createTestDatabase();
    database.sqlite.exec(`
      CREATE TRIGGER reject_webhook BEFORE INSERT ON outbox
      WHEN NEW.channel = 'webhook'
      BEGIN SELECT RAISE(ABORT, 'forced failure'); END;
    `);
    await expect(storeLead({
      db: database.db,
      lead: leadDraft(),
      idempotencyHeader: "transaction-test-key",
      emailMaxAttempts: 3,
      webhookMaxAttempts: 3,
      now: baseTime,
    })).rejects.toThrow("forced failure");
    expect(database.count("SELECT COUNT(*) AS count FROM idempotency_keys")).toBe(0);
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(0);
    expect(database.count("SELECT COUNT(*) AS count FROM outbox")).toBe(0);
  });
});

describe("outbox delivery states", () => {
  it("records Resend acceptance as email_accepted, not inbox delivery", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 202 }));
    const result = await deliverOutbox({
      env: testEnv(database.db), outboxId: stored.outboxIds[0], dependencies: { now: () => baseTime, fetchImpl },
    });
    expect(result).toMatchObject({ status: "email_accepted", retryQueue: false });
    expect(outbox(database, "email").status).toBe("email_accepted");
    expect(outbox(database, "webhook").status).toBe("pending");
    const attempt = database.sqlite.prepare("SELECT * FROM delivery_attempts").get() as {
      outcome: string; http_status: number; error_category: string;
    };
    expect(attempt).toMatchObject({ outcome: "accepted", http_status: 202, error_category: "provider_accepted" });
    const repeated = await deliverOutbox({
      env: testEnv(database.db), outboxId: stored.outboxIds[0], dependencies: { now: () => baseTime, fetchImpl },
    });
    expect(repeated.status).toBe("already_finished");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("records a 2xx CRM response as webhook_acknowledged independently", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
    const result = await deliverOutbox({
      env: testEnv(database.db), outboxId: stored.outboxIds[1], dependencies: { now: () => baseTime, fetchImpl },
    });
    expect(result).toMatchObject({ status: "webhook_acknowledged", retryQueue: false });
    expect(outbox(database, "webhook").status).toBe("webhook_acknowledged");
    expect(outbox(database, "email").status).toBe("pending");
  });

  it("schedules transient failure with backoff and does not send before the due time", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 503 }));
    const env = testEnv(database.db);
    const first = await deliverOutbox({ env, outboxId: stored.outboxIds[0], dependencies: { now: () => baseTime, fetchImpl } });
    expect(first).toMatchObject({ status: "retry_scheduled", retryQueue: true });
    expect(outbox(database, "email")).toMatchObject({
      status: "retry_scheduled",
      attempt_count: 1,
      next_attempt_at: new Date(baseTime + 60_000).toISOString(),
    });
    const early = await deliverOutbox({ env, outboxId: stored.outboxIds[0], dependencies: { now: () => baseTime + 1_000, fetchImpl } });
    expect(early.status).toBe("not_due");
    expect(fetchImpl).toHaveBeenCalledOnce();

    fetchImpl.mockResolvedValueOnce(new Response(null, { status: 202 }));
    const accepted = await deliverOutbox({
      env, outboxId: stored.outboxIds[0], dependencies: { now: () => baseTime + 60_000, fetchImpl },
    });
    expect(accepted.status).toBe("email_accepted");
    expect(outbox(database, "email").attempt_count).toBe(2);
  });

  it("keeps permanent provider rejection as failed without retry", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 400 }));
    const result = await deliverOutbox({
      env: testEnv(database.db), outboxId: stored.outboxIds[0], dependencies: { now: () => baseTime, fetchImpl },
    });
    expect(result).toMatchObject({ status: "failed", retryQueue: false });
    expect(outbox(database, "email").status).toBe("failed");
    expect(database.sqlite.prepare("SELECT outcome FROM delivery_attempts").get()).toEqual({ outcome: "permanent" });
  });

  it("dead-letters after the configured bounded attempts and never sends a fourth request", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 503 }));
    const env = testEnv(database.db);
    let now = baseTime;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await deliverOutbox({ env, outboxId: stored.outboxIds[0], dependencies: { now: () => now, fetchImpl } });
      expect(result.status).toBe(attempt === 3 ? "dead_letter" : "retry_scheduled");
      if (attempt < 3) now += 60_000 * 2 ** (attempt - 1);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(outbox(database, "email")).toMatchObject({ status: "dead_letter", attempt_count: 3 });
    const outcomes = database.sqlite.prepare("SELECT outcome FROM delivery_attempts ORDER BY attempt_number").all();
    expect(outcomes).toEqual([{ outcome: "retryable" }, { outcome: "retryable" }, { outcome: "dead_letter" }]);
    const after = await deliverOutbox({ env, outboxId: stored.outboxIds[0], dependencies: { now: () => now + 3_600_000, fetchImpl } });
    expect(after.status).toBe("already_finished");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("repairs an interrupted exhausted lease without another provider request", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const row = outbox(database, "email");
    database.sqlite.prepare(`
      UPDATE outbox SET status = 'processing', attempt_count = max_attempts,
        locked_until = ?, next_attempt_at = ? WHERE id = ?
    `).run(new Date(baseTime - 1).toISOString(), new Date(baseTime - 2).toISOString(), row.id);
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await deliverOutbox({
      env: testEnv(database.db), outboxId: row.id, dependencies: { now: () => baseTime, fetchImpl },
    });
    expect(result).toMatchObject({ status: "dead_letter", retryQueue: true });
    expect(outbox(database, "email")).toMatchObject({ status: "dead_letter", attempt_count: 3 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("prevents a stale worker from overwriting a newer lease or attempt record", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    let release!: (response: Response) => void;
    const slowResponse = new Promise<Response>((resolve) => { release = resolve; });
    const slowFetch = vi.fn<typeof fetch>(async () => slowResponse);
    let clock = baseTime;
    const first = deliverOutbox({
      env: testEnv(database.db), outboxId: stored.outboxIds[0],
      dependencies: { now: () => clock, fetchImpl: slowFetch },
    });
    await vi.waitFor(() => expect(slowFetch).toHaveBeenCalledOnce());

    clock = baseTime + 121_000;
    const freshFetch = vi.fn<typeof fetch>(async () => new Response(null, { status: 202 }));
    const second = await deliverOutbox({
      env: testEnv(database.db), outboxId: stored.outboxIds[0],
      dependencies: { now: () => clock, fetchImpl: freshFetch },
    });
    expect(second.status).toBe("email_accepted");
    release(new Response(null, { status: 503 }));
    await expect(first).resolves.toMatchObject({ status: "already_finished", retryQueue: false });
    expect(outbox(database, "email")).toMatchObject({ status: "email_accepted", attempt_count: 2 });
    expect(database.sqlite.prepare("SELECT attempt_number, outcome FROM delivery_attempts").all())
      .toEqual([{ attempt_number: 2, outcome: "accepted" }]);
  });

  it("marks missing channel configuration as a permanent failed delivery", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const env = { ...testEnv(database.db), RESEND_API_KEY: undefined };
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await deliverOutbox({ env, outboxId: stored.outboxIds[0], dependencies: { now: () => baseTime, fetchImpl } });
    expect(result.status).toBe("failed");
    expect(outbox(database, "email").status).toBe("failed");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("email construction", () => {
  it("uses fixed server recipients, a stable provider idempotency key and escaped HTML", async () => {
    const database = createTestDatabase();
    const stored = await seed(database, { name: "<script>alert(1)</script>", message: "<img src=x onerror=alert(1)>" });
    const lead = await getLeadById(database.db, stored.leadId);
    if (!lead) throw new Error("missing lead");
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 202 }));
    const result = await deliverEmail({ config: readConfig(testEnv()).email, lead, deliveryId: "del_stable", fetchImpl });
    expect(result).toMatchObject({ outcome: "accepted", errorCategory: "provider_accepted" });
    const init = fetchImpl.mock.calls[0][1]!;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-resend-key");
    expect(headers["Idempotency-Key"]).toBe("del_stable");
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["owner@example.test"]);
    expect(body.reply_to).toBe("reply@example.test");
    expect(body.html).not.toContain("<script>");
    expect(body.html).not.toContain("<img");
    expect(body.html).toContain("&lt;script&gt;");
    expect(body.text).toContain("<script>alert(1)</script>");
  });

  it("classifies rate limits and provider rejection without reading response bodies", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const lead = await getLeadById(database.db, stored.leadId);
    if (!lead) throw new Error("missing lead");
    const config = readConfig(testEnv()).email;
    const limited = vi.fn<typeof fetch>(async () => new Response("provider detail", { status: 429 }));
    await expect(deliverEmail({ config, lead, deliveryId: "del_stable", fetchImpl: limited }))
      .resolves.toMatchObject({ outcome: "retryable", errorCategory: "provider_unavailable" });
    const rejected = vi.fn<typeof fetch>(async () => new Response("provider detail", { status: 422 }));
    await expect(deliverEmail({ config, lead, deliveryId: "del_stable", fetchImpl: rejected }))
      .resolves.toMatchObject({ outcome: "permanent", errorCategory: "provider_rejected" });
  });
});

describe("queue consumption and repair", () => {
  it("acks a finished delivery and retries a scheduled one", async () => {
    const database = createTestDatabase();
    const stored = await seed(database);
    const env = testEnv(database.db);
    const acceptedMessage = queueMessage({ outboxId: stored.outboxIds[0] });
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 202 }));
    await consumeBatch({ messages: [acceptedMessage], ackAll: vi.fn(), retryAll: vi.fn() }, env, { now: () => baseTime, fetchImpl });
    expect(acceptedMessage.ack).toHaveBeenCalledOnce();
    expect(acceptedMessage.retry).not.toHaveBeenCalled();

    const retryMessage = queueMessage({ outboxId: stored.outboxIds[1] });
    const unavailable = vi.fn<typeof fetch>(async () => new Response(null, { status: 503 }));
    await expect(consumeBatch({ messages: [retryMessage], ackAll: vi.fn(), retryAll: vi.fn() }, env, { now: () => baseTime, fetchImpl: unavailable }))
      .rejects.toThrow("queue_delivery_retry_required");
    expect(retryMessage.retry).toHaveBeenCalledOnce();
    expect(retryMessage.ack).not.toHaveBeenCalled();
  });

  it("retries malformed or unprocessable queue work rather than inventing success", async () => {
    const database = createTestDatabase();
    const malformed = queueMessage({ outboxId: "not-an-outbox-id", pii: "ignored" });
    await expect(consumeBatch({ messages: [malformed], ackAll: vi.fn(), retryAll: vi.fn() }, testEnv(database.db)))
      .rejects.toThrow("queue_delivery_retry_required");
    expect(malformed.retry).toHaveBeenCalledOnce();
    expect(malformed.ack).not.toHaveBeenCalled();

    const stored = await seed(database);
    const brokenMessage = queueMessage({ outboxId: stored.outboxIds[0] });
    const env: Env = { ...testEnv(database.db), DB: undefined };
    await expect(consumeBatch({ messages: [brokenMessage], ackAll: vi.fn(), retryAll: vi.fn() }, env))
      .rejects.toThrow("queue_delivery_retry_required");
    expect(brokenMessage.retry).toHaveBeenCalledOnce();
  });

  it("re-enqueues only due pending, retry-scheduled or expired-lease work", async () => {
    const database = createTestDatabase();
    const first = await seed(database);
    const second = await seed(database, {}, "second-seed-key");
    database.sqlite.prepare("UPDATE outbox SET next_attempt_at = ? WHERE lead_id = ?")
      .run(new Date(baseTime + 60_000).toISOString(), second.leadId);
    database.sqlite.prepare("UPDATE outbox SET status = 'processing', locked_until = ? WHERE lead_id = ?")
      .run(new Date(baseTime - 1).toISOString(), second.leadId);
    const send = vi.fn(async (_payload: { outboxId: string }) => undefined);
    await runScheduledRepair(
      { scheduledTime: baseTime, cron: "*/5 * * * *", noRetry: vi.fn() },
      { ...testEnv(database.db), LEAD_QUEUE: { send } },
    );
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.map(([payload]) => payload.outboxId).sort()).toEqual([...first.outboxIds].sort());
    expect(database.count("SELECT COUNT(*) AS count FROM leads")).toBe(2);
  });
});
