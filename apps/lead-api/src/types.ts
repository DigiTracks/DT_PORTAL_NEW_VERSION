export type SqlValue = string | number | null;

export interface D1Meta {
  changes: number;
  last_row_id: number;
  duration: number;
}

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: true;
  meta: D1Meta;
}

/** The narrow D1 surface used by this Worker, also implemented by the test adapter. */
export interface D1Statement<T = Record<string, unknown>> {
  bind(...values: SqlValue[]): D1Statement<T>;
  run(): Promise<D1Result<T>>;
  first(): Promise<T | null>;
  all(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare<T = Record<string, unknown>>(query: string): D1Statement<T>;
  batch<T = Record<string, unknown>>(statements: readonly D1Statement<T>[]): Promise<D1Result<T>[]>;
}

export interface QueuePayload {
  outboxId: string;
}

export interface LeadQueue {
  send(message: QueuePayload, options?: { contentType?: string }): Promise<void>;
}

export interface QueueMessage {
  readonly id: string;
  readonly timestamp: Date;
  readonly body: unknown;
  readonly attempts: number;
  ack(): void;
  retry(): void;
}

export interface MessageBatch {
  readonly messages: readonly QueueMessage[];
  ackAll(): void;
  retryAll(): void;
}

export interface AnalyticsEngineDataPoint {
  indexes?: string[];
  blobs?: string[];
  doubles?: number[];
}

export interface AnalyticsEngineDataset {
  writeDataPoint(point?: AnalyticsEngineDataPoint): void;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface ScheduledController {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}

export interface Env {
  ENVIRONMENT?: string;
  ALLOWED_LOCAL_ORIGINS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;

  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_EXPECTED_ACTION?: string;
  TURNSTILE_EXPECTED_HOSTNAMES?: string;

  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  LEAD_NOTIFICATION_TO?: string;
  LEAD_REPLY_TO_EMAIL?: string;
  EMAIL_TIMEOUT_MS?: string;
  EMAIL_MAX_ATTEMPTS?: string;

  CRM_WEBHOOK_URL?: string;
  CRM_WEBHOOK_SECRET?: string;
  CRM_WEBHOOK_PREVIOUS_SECRET?: string;
  CRM_FIELD_MAPPING_JSON?: string;
  WEBHOOK_TIMEOUT_MS?: string;
  WEBHOOK_REPLAY_WINDOW_SECONDS?: string;
  WEBHOOK_MAX_ATTEMPTS?: string;

  ADMIN_TOKEN?: string;
  DEMO_GRANT_SECRET?: string;
  DEMO_GRANT_PREVIOUS_SECRET?: string;
  DEMO_DESTINATIONS_JSON?: string;
  DEMO_GRANT_TTL_HOURS?: string;

  DB?: D1Database;
  LEAD_QUEUE?: LeadQueue;
  ANALYTICS?: AnalyticsEngineDataset;
  [key: string]: unknown;
}

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface ApproximateRateLimiter {
  check(input: { key: string; limit: number; windowSeconds: number; now: number }): RateLimitDecision;
}

export interface TurnstileConfig {
  secret: string;
  siteKey: string;
  expectedAction: string;
  expectedHostnames: readonly string[];
}

export type TurnstileVerifier = (
  token: string,
  config: TurnstileConfig,
  fetchImpl: typeof fetch,
) => Promise<boolean>;

export interface WorkerDependencies {
  now?: () => number;
  fetchImpl?: typeof fetch;
  turnstileVerifier?: TurnstileVerifier;
  rateLimiter?: ApproximateRateLimiter;
}
