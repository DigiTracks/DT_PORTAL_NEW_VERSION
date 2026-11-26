import { trackFromEnv } from "./analytics";
import { readConfig } from "./config";
import { deliverEmail } from "./email";
import { getLeadById } from "./leads";
import type { D1Database, Env, MessageBatch, QueueMessage, ScheduledController, WorkerDependencies } from "./types";
import { deliverWebhook, type DeliveryResult } from "./webhook";

interface ClaimedOutbox {
  id: string;
  lead_id: string;
  channel: "email" | "webhook";
  delivery_id: string;
  attempt_count: number;
  max_attempts: number;
  locked_until: string;
}

interface DueOutbox {
  id: string;
}

export interface DeliveryOutcome {
  outboxId: string;
  status: "email_accepted" | "webhook_acknowledged" | "failed" | "retry_scheduled" | "dead_letter" | "not_due" | "already_finished";
  retryQueue: boolean;
}

function iso(now: number): string {
  return new Date(now).toISOString();
}

async function repairExhaustedOutbox(db: D1Database, outboxId: string, now: number): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE outbox
       SET status = 'dead_letter', locked_until = NULL,
           last_error_category = 'attempt_interrupted', updated_at = ?
       WHERE id = ?
         AND attempt_count >= max_attempts
         AND next_attempt_at <= ?
         AND (status IN ('pending', 'retry_scheduled') OR (status = 'processing' AND locked_until <= ?))`,
    )
    .bind(iso(now), outboxId, iso(now), iso(now))
    .run();
  return result.meta.changes === 1;
}

async function claimOutbox(db: D1Database, outboxId: string, now: number): Promise<ClaimedOutbox | null> {
  return db
    .prepare<ClaimedOutbox>(
      `UPDATE outbox
       SET status = 'processing', attempt_count = attempt_count + 1, locked_until = ?, updated_at = ?
       WHERE id = ?
         AND attempt_count < max_attempts
         AND next_attempt_at <= ?
         AND (status IN ('pending', 'retry_scheduled') OR (status = 'processing' AND locked_until <= ?))
       RETURNING id, lead_id, channel, delivery_id, attempt_count, max_attempts, locked_until`,
    )
    .bind(iso(now + 120_000), iso(now), outboxId, iso(now), iso(now))
    .first();
}

async function finishOutbox(input: {
  db: D1Database;
  outbox: ClaimedOutbox;
  result: DeliveryResult;
  status: "email_accepted" | "webhook_acknowledged" | "failed" | "retry_scheduled" | "dead_letter";
  now: number;
  nextAttemptAt?: number;
}): Promise<boolean> {
  const attemptOutcome =
    input.status === "email_accepted" || input.status === "webhook_acknowledged"
      ? "accepted"
      : input.status === "dead_letter"
        ? "dead_letter"
        : input.status === "retry_scheduled"
          ? "retryable"
          : "permanent";
  const timestamp = iso(input.now);
  const results = await input.db.batch([
    // Only the worker that still owns this exact lease may finish the attempt.
    // This prevents a late provider response from clobbering a newer retry.
    input.db
      .prepare(
        `UPDATE outbox
         SET status = ?, next_attempt_at = ?, locked_until = NULL, last_error_category = ?,
             last_http_status = ?, updated_at = ?
         WHERE id = ? AND status = 'processing' AND attempt_count = ? AND locked_until = ?`,
      )
      .bind(
        input.status,
        input.nextAttemptAt === undefined ? timestamp : iso(input.nextAttemptAt),
        input.result.errorCategory,
        input.result.httpStatus ?? null,
        timestamp,
        input.outbox.id,
        input.outbox.attempt_count,
        input.outbox.locked_until,
      ),
    input.db
      .prepare(
        `INSERT INTO delivery_attempts
          (outbox_id, attempt_number, channel, outcome, http_status, duration_ms, error_category, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1`,
      )
      .bind(
        input.outbox.id,
        input.outbox.attempt_count,
        input.outbox.channel,
        attemptOutcome,
        input.result.httpStatus ?? null,
        input.result.durationMs,
        input.result.errorCategory,
        timestamp,
      ),
  ]);
  return results[0].meta.changes === 1;
}

function backoffMs(attemptNumber: number): number {
  return Math.min(60_000 * 2 ** Math.max(0, attemptNumber - 1), 3_600_000);
}

function parseQueueBody(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "outboxId") return null;
  const outboxId = (body as { outboxId?: unknown }).outboxId;
  return typeof outboxId === "string" && /^out_[a-f0-9]{32}$/.test(outboxId) ? outboxId : null;
}

export async function deliverOutbox(input: {
  env: Env;
  outboxId: string;
  dependencies?: WorkerDependencies;
}): Promise<DeliveryOutcome> {
  const db = input.env.DB;
  if (!db) return { outboxId: input.outboxId, status: "failed", retryQueue: true };
  const dependencies = input.dependencies ?? {};
  const now = dependencies.now?.() ?? Date.now();
  const config = readConfig(input.env);
  if (await repairExhaustedOutbox(db, input.outboxId, now)) {
    return { outboxId: input.outboxId, status: "dead_letter", retryQueue: true };
  }
  const outbox = await claimOutbox(db, input.outboxId, now);
  if (!outbox) {
    const existing = await db
      .prepare<{ status: string; next_attempt_at: string }>("SELECT status, next_attempt_at FROM outbox WHERE id = ?")
      .bind(input.outboxId)
      .first();
    if (!existing) return { outboxId: input.outboxId, status: "already_finished", retryQueue: false };
    return {
      outboxId: input.outboxId,
      status: existing.next_attempt_at > iso(now) ? "not_due" : "already_finished",
      retryQueue: false,
    };
  }

  const lead = await getLeadById(db, outbox.lead_id);
  let result: DeliveryResult;
  if (!lead) {
    result = { outcome: "permanent", errorCategory: "data_error", durationMs: 0 };
  } else if (outbox.channel === "email") {
    result = await deliverEmail({
      config: config.email,
      lead,
      deliveryId: outbox.delivery_id,
      fetchImpl: dependencies.fetchImpl ?? fetch,
    });
  } else {
    result = await deliverWebhook({
      config: config.webhook,
      lead,
      deliveryId: outbox.delivery_id,
      fetchImpl: dependencies.fetchImpl ?? fetch,
      now: dependencies.now ?? Date.now,
    });
  }

  if (result.outcome === "accepted") {
    const status = outbox.channel === "email" ? "email_accepted" : "webhook_acknowledged";
    if (!(await finishOutbox({ db, outbox, result, status, now }))) {
      return { outboxId: outbox.id, status: "already_finished", retryQueue: false };
    }
    await trackFromEnv(
      input.env,
      outbox.channel === "email" ? "lead_delivery_email" : "lead_delivery_webhook",
      lead
        ? { intent: lead.intent, productId: lead.productId, correlationId: lead.id, destination: outbox.channel, errorCategory: result.errorCategory }
        : { destination: outbox.channel, errorCategory: result.errorCategory },
    );
    return { outboxId: outbox.id, status, retryQueue: false };
  }

  if (result.outcome === "permanent") {
    if (!(await finishOutbox({ db, outbox, result, status: "failed", now }))) {
      return { outboxId: outbox.id, status: "already_finished", retryQueue: false };
    }
    await trackFromEnv(input.env, "lead_delivery_failed", {
      intent: lead?.intent,
      productId: lead?.productId,
      correlationId: lead?.id,
      destination: outbox.channel,
      errorCategory: result.errorCategory,
    });
    return { outboxId: outbox.id, status: "failed", retryQueue: false };
  }

  if (outbox.attempt_count >= outbox.max_attempts) {
    if (!(await finishOutbox({ db, outbox, result, status: "dead_letter", now }))) {
      return { outboxId: outbox.id, status: "already_finished", retryQueue: false };
    }
    await trackFromEnv(input.env, "lead_delivery_failed", {
      intent: lead?.intent,
      productId: lead?.productId,
      correlationId: lead?.id,
      destination: outbox.channel,
      errorCategory: "retries_exhausted",
    });
    // Keep throwing for this work item so Cloudflare can move it to the
    // configured dead-letter queue after its own bounded retry budget.
    return { outboxId: outbox.id, status: "dead_letter", retryQueue: true };
  }

  const nextAttemptAt = now + backoffMs(outbox.attempt_count);
  if (!(await finishOutbox({ db, outbox, result, status: "retry_scheduled", now, nextAttemptAt }))) {
    return { outboxId: outbox.id, status: "already_finished", retryQueue: false };
  }
  return { outboxId: outbox.id, status: "retry_scheduled", retryQueue: true };
}

export async function consumeBatch(batch: MessageBatch, env: Env, dependencies?: WorkerDependencies): Promise<void> {
  let retryRequired = false;
  for (const message of batch.messages) {
    const outboxId = parseQueueBody(message.body);
    if (!outboxId) {
      message.retry();
      retryRequired = true;
      continue;
    }
    try {
      const outcome = await deliverOutbox({ env, outboxId, dependencies });
      if (outcome.retryQueue) {
        message.retry();
        retryRequired = true;
      } else {
        message.ack();
      }
    } catch {
      // The D1 lease and cron repair path recover interrupted processing.
      message.retry();
      retryRequired = true;
    }
  }
  if (retryRequired) throw new Error("queue_delivery_retry_required");
}

export async function consumeMessage(message: QueueMessage, env: Env, dependencies?: WorkerDependencies): Promise<void> {
  await consumeBatch(
    {
      messages: [message],
      ackAll: () => message.ack(),
      retryAll: () => message.retry(),
    },
    env,
    dependencies,
  );
}

export async function runScheduledRepair(controller: ScheduledController, env: Env): Promise<void> {
  if (!env.DB || !env.LEAD_QUEUE) return;
  const now = controller.scheduledTime;
  const due = await env.DB
    .prepare<DueOutbox>(
      `SELECT id FROM outbox
       WHERE next_attempt_at <= ?
         AND (status IN ('pending', 'retry_scheduled') OR (status = 'processing' AND locked_until <= ?))
       ORDER BY next_attempt_at ASC LIMIT 100`,
    )
    .bind(iso(now), iso(now))
    .all();
  await Promise.all(due.results.map((row) => env.LEAD_QUEUE!.send({ outboxId: row.id }, { contentType: "application/json" })));
}
