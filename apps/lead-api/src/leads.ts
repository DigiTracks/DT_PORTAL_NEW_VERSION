import type { LeadIntent } from "./validation";
import type { D1Database } from "./types";

export interface LeadRecord {
  id: string;
  receiptId: string;
  intent: LeadIntent;
  name: string;
  email: string;
  organization: string | null;
  productId: string | null;
  sourceOrigin: string;
  pagePath: string;
  message: string;
  consent: number;
  locale: string;
  status: "received";
  receivedAt: string;
}

interface LeadRow {
  id: string;
  receipt_id: string;
  intent: LeadIntent;
  name: string;
  email: string;
  organization: string | null;
  product_id: string | null;
  source_origin: string;
  page_path: string;
  message: string;
  consent: number;
  locale: string;
  status: "received";
  received_at: string;
}

export interface StoredLead {
  leadId: string;
  receiptId: string;
  duplicate: boolean;
  outboxIds: readonly string[];
}

function rowToLead(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    intent: row.intent,
    name: row.name,
    email: row.email,
    organization: row.organization,
    productId: row.product_id,
    sourceOrigin: row.source_origin,
    pagePath: row.page_path,
    message: row.message,
    consent: row.consent,
    locale: row.locale,
    status: row.status,
    receivedAt: row.received_at,
  };
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function canonicalRequest(lead: Omit<LeadRecord, "id" | "receiptId" | "status" | "receivedAt">): string {
  return JSON.stringify([
    lead.intent,
    lead.name,
    lead.email,
    lead.organization,
    lead.productId,
    lead.sourceOrigin,
    lead.pagePath,
    lead.message,
    lead.consent,
    lead.locale,
  ]);
}

export async function storeLead(input: {
  db: D1Database;
  lead: Omit<LeadRecord, "id" | "receiptId" | "status" | "receivedAt">;
  idempotencyHeader: string;
  emailMaxAttempts: number;
  webhookMaxAttempts: number;
  now: number;
}): Promise<StoredLead | { conflict: true }> {
  const fingerprint = await sha256(canonicalRequest(input.lead));
  // The request nonce identifies the operation; the fingerprint detects reuse
  // with different content. Including the fingerprint in the key would make
  // conflicts impossible and silently create a second lead instead.
  const keyHash = await sha256(`lead-v1\0${input.lead.sourceOrigin}\0${input.idempotencyHeader}`);
  const leadId = id("lead");
  const receiptId = id("rcpt");
  const emailOutboxId = id("out");
  const webhookOutboxId = id("out");
  const emailDeliveryId = id("del");
  const webhookDeliveryId = id("del");
  const timestamp = new Date(input.now).toISOString();

  // D1 batch is transactional. changes() keeps every dependent insert on the
  // first (new) idempotency row and makes concurrent duplicate work a no-op.
  const results = await input.db.batch([
    input.db
      .prepare("INSERT OR IGNORE INTO idempotency_keys (key_hash, fingerprint, lead_id, receipt_id, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(keyHash, fingerprint, leadId, receiptId, timestamp),
    input.db
      .prepare(
        `INSERT INTO leads
          (id, receipt_id, intent, name, email, organization, product_id, source_origin, page_path, message, consent, locale, status, received_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ? WHERE changes() = 1`,
      )
      .bind(
        leadId,
        receiptId,
        input.lead.intent,
        input.lead.name,
        input.lead.email,
        input.lead.organization,
        input.lead.productId,
        input.lead.sourceOrigin,
        input.lead.pagePath,
        input.lead.message,
        input.lead.consent,
        input.lead.locale,
        timestamp,
      ),
    input.db
      .prepare(
        `INSERT INTO outbox
          (id, lead_id, channel, delivery_id, status, attempt_count, max_attempts, next_attempt_at, created_at, updated_at)
         SELECT ?, ?, 'email', ?, 'pending', 0, ?, ?, ?, ? WHERE changes() = 1`,
      )
      .bind(emailOutboxId, leadId, emailDeliveryId, input.emailMaxAttempts, timestamp, timestamp, timestamp),
    input.db
      .prepare(
        `INSERT INTO outbox
          (id, lead_id, channel, delivery_id, status, attempt_count, max_attempts, next_attempt_at, created_at, updated_at)
         SELECT ?, ?, 'webhook', ?, 'pending', 0, ?, ?, ?, ? WHERE changes() = 1`,
      )
      .bind(webhookOutboxId, leadId, webhookDeliveryId, input.webhookMaxAttempts, timestamp, timestamp, timestamp),
    input.db
      .prepare<{ fingerprint: string; lead_id: string; receipt_id: string }>(
        "SELECT fingerprint, lead_id, receipt_id FROM idempotency_keys WHERE key_hash = ?",
      )
      .bind(keyHash),
  ]);

  const record = results[4].results[0] as { fingerprint: string; lead_id: string; receipt_id: string } | undefined;
  if (!record) throw new Error("idempotency_read_failed");
  if (record.fingerprint !== fingerprint) return { conflict: true };
  return {
    leadId: record.lead_id,
    receiptId: record.receipt_id,
    duplicate: results[0].meta.changes === 0,
    outboxIds: results[0].meta.changes === 1 ? [emailOutboxId, webhookOutboxId] : [],
  };
}

export async function getLeadById(db: D1Database, leadId: string): Promise<LeadRecord | null> {
  const row = await db
    .prepare<LeadRow>(
      `SELECT id, receipt_id, intent, name, email, organization, product_id, source_origin,
              page_path, message, consent, locale, status, received_at
       FROM leads WHERE id = ?`,
    )
    .bind(leadId)
    .first();
  return row ? rowToLead(row) : null;
}

export async function getReceiptById(db: D1Database, receiptId: string): Promise<{ leadId: string; receiptId: string } | null> {
  const row = await db
    .prepare<{ lead_id: string; receipt_id: string }>("SELECT lead_id, receipt_id FROM idempotency_keys WHERE receipt_id = ?")
    .bind(receiptId)
    .first();
  return row ? { leadId: row.lead_id, receiptId: row.receipt_id } : null;
}
