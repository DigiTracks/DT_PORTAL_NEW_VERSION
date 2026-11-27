import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, vi } from "vitest";
import { storeLead, type LeadRecord } from "../src/leads";
import type {
  AnalyticsEngineDataPoint,
  D1Database,
  D1Result,
  D1Statement,
  Env,
  ExecutionContext,
  SqlValue,
} from "../src/types";

const openDatabases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of openDatabases.splice(0)) database.close();
});

class SqliteStatement<T> implements D1Statement<T> {
  constructor(
    private readonly database: DatabaseSync,
    private readonly query: string,
    private readonly values: readonly SqlValue[] = [],
  ) {}

  bind(...values: SqlValue[]): D1Statement<T> {
    return new SqliteStatement<T>(this.database, this.query, values);
  }

  async run(): Promise<D1Result<T>> {
    const result = this.database.prepare(this.query).run(...this.values);
    return {
      results: [],
      success: true,
      meta: {
        changes: Number(result.changes),
        last_row_id: Number(result.lastInsertRowid),
        duration: 0,
      },
    };
  }

  async first(): Promise<T | null> {
    return (this.database.prepare(this.query).get(...this.values) ?? null) as T | null;
  }

  async all(): Promise<D1Result<T>> {
    return {
      results: this.database.prepare(this.query).all(...this.values) as T[],
      success: true,
      meta: { changes: 0, last_row_id: 0, duration: 0 },
    };
  }

  async batchResult(): Promise<D1Result<T>> {
    if (/^\s*(SELECT|PRAGMA)\b/i.test(this.query)) return this.all();
    return this.run();
  }
}

export interface TestDatabase {
  db: D1Database;
  sqlite: DatabaseSync;
  count(query: string, ...values: SqlValue[]): number;
}

export function createTestDatabase(): TestDatabase {
  const sqlite = new DatabaseSync(":memory:");
  openDatabases.push(sqlite);
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(readFileSync(new URL("../migrations/0001_lead_delivery.sql", import.meta.url), "utf8"));
  const db: D1Database = {
    prepare<T>(query: string): D1Statement<T> {
      return new SqliteStatement<T>(sqlite, query);
    },
    async batch<T>(statements: readonly D1Statement<T>[]): Promise<D1Result<T>[]> {
      sqlite.exec("BEGIN");
      try {
        const results: D1Result<T>[] = [];
        for (const statement of statements) {
          if (!(statement instanceof SqliteStatement)) throw new Error("unsupported_test_statement");
          results.push(await statement.batchResult());
        }
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return {
    db,
    sqlite,
    count(query, ...values) {
      const row = sqlite.prepare(query).get(...values) as { count: number };
      return Number(row.count);
    },
  };
}

export type LeadDraft = Omit<LeadRecord, "id" | "receiptId" | "status" | "receivedAt">;

export function leadDraft(overrides: Partial<LeadDraft> = {}): LeadDraft {
  return {
    intent: "product-enquiry",
    name: "Example Visitor",
    email: "visitor@example.com",
    organization: "Example Organization",
    productId: "vedik",
    sourceOrigin: "https://digitracks.net",
    pagePath: "/products/vedik/",
    message: "Please discuss our deployment requirements.",
    consent: 1,
    locale: "en-GB",
    ...overrides,
  };
}

export async function seedLead(
  database: TestDatabase,
  overrides: Partial<LeadDraft> = {},
  idempotencyKey = "seed-idempotency-key",
) {
  return storeLead({
    db: database.db,
    lead: leadDraft(overrides),
    idempotencyHeader: idempotencyKey,
    emailMaxAttempts: 3,
    webhookMaxAttempts: 3,
    now: Date.parse("2026-11-25T12:00:00.000Z"),
  });
}

export function validLeadPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    intent: "product-enquiry",
    name: "Example Visitor",
    email: "visitor@example.com",
    organization: "Example Organization",
    productId: "vedik",
    page: "/products/vedik/",
    message: "Please discuss our deployment requirements.",
    consent: true,
    honeypot: "",
    locale: "en-GB",
    turnstileToken: "test-turnstile-token",
    ...overrides,
  };
}

export function testEnv(db?: D1Database): Env {
  return {
    ENVIRONMENT: "test",
    ALLOWED_LOCAL_ORIGINS: "http://localhost:8788",
    RATE_LIMIT_PER_MINUTE: "10",
    RATE_LIMIT_WINDOW_SECONDS: "60",
    TURNSTILE_SITE_KEY: "test-site-key",
    TURNSTILE_SECRET: "test-turnstile-secret",
    TURNSTILE_EXPECTED_ACTION: "lead",
    TURNSTILE_EXPECTED_HOSTNAMES: "digitracks.net,learn.digitracks.net,sourcecraft.digitracks.net,procuresherpa.digitracks.net,learnpmo.digitracks.net,hcmfusion.digitracks.net,localhost",
    RESEND_API_KEY: "test-resend-key",
    RESEND_FROM_EMAIL: "DigiTracks <leads@example.test>",
    LEAD_NOTIFICATION_TO: "owner@example.test",
    LEAD_REPLY_TO_EMAIL: "reply@example.test",
    CRM_WEBHOOK_URL: "https://crm.example.test/leads",
    CRM_WEBHOOK_SECRET: "crm-signing-secret-000000000000000000",
    CRM_FIELD_MAPPING_JSON: JSON.stringify({ intent: "intent", email: "email", message: "requirement" }),
    ADMIN_TOKEN: "operator-token-000000000000000000000000",
    DEMO_GRANT_SECRET: "demo-signing-secret-0000000000000000",
    DEMO_DESTINATIONS_JSON: JSON.stringify({ unify: "https://demo.example.test/unify?access=server-configured" }),
    DEMO_GRANT_TTL_HOURS: "168",
    DB: db,
    LEAD_QUEUE: { send: vi.fn(async () => undefined) },
  };
}

export function testContext(): ExecutionContext {
  return { waitUntil: vi.fn(), passThroughOnException: vi.fn() };
}

export function captureAnalytics(): { dataset: { writeDataPoint(point?: AnalyticsEngineDataPoint): void }; points: AnalyticsEngineDataPoint[] } {
  const points: AnalyticsEngineDataPoint[] = [];
  return { dataset: { writeDataPoint: (point) => { if (point) points.push(point); } }, points };
}

export interface LeadRequestOptions {
  origin?: string;
  idempotencyKey?: string | null;
  method?: string;
  ip?: string;
  rawBody?: string;
  contentType?: string;
}

export function leadRequest(payload: Record<string, unknown> = validLeadPayload(), options: LeadRequestOptions = {}): Request {
  const headers = new Headers({
    Origin: options.origin ?? "https://digitracks.net",
    "Content-Type": options.contentType ?? "application/json",
    "CF-Connecting-IP": options.ip ?? "203.0.113.10",
  });
  const key = options.idempotencyKey === undefined ? "request-idempotency-key" : options.idempotencyKey;
  if (key !== null) headers.set("Idempotency-Key", key);
  return new Request("https://api.example.test/api/lead", {
    method: options.method ?? "POST",
    headers,
    ...(options.method === "GET" || options.method === "HEAD" ? {} : { body: options.rawBody ?? JSON.stringify(payload) }),
  });
}

export async function jsonBody(response: Response): Promise<any> {
  return response.json();
}
