import { WEBHOOK_EVENT_VERSION, type WebhookConfig, type WebhookFieldMapping, type WebhookSourceField } from "./config";
import type { LeadRecord } from "./leads";

export interface DeliveryResult {
  outcome: "accepted" | "retryable" | "permanent";
  httpStatus?: number;
  errorCategory: string;
  durationMs: number;
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function signWebhook(secret: string, timestamp: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  return `v1=${[...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function verifyWebhookSignature(input: {
  secrets: readonly string[];
  timestamp: string;
  rawBody: string;
  signature: string;
  nowSeconds: number;
  replayWindowSeconds: number;
}): Promise<boolean> {
  if (!/^[0-9]{1,12}$/.test(input.timestamp) || !/^v1=[a-f0-9]{64}$/.test(input.signature)) return false;
  const timestamp = Number(input.timestamp);
  if (!Number.isSafeInteger(timestamp) || Math.abs(input.nowSeconds - timestamp) > input.replayWindowSeconds) return false;
  const supplied = Uint8Array.from(input.signature.slice(3).match(/../g)!, (pair) => Number.parseInt(pair, 16));
  const message = new TextEncoder().encode(`${input.timestamp}.${input.rawBody}`);
  for (const secret of input.secrets) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    if (await crypto.subtle.verify("HMAC", key, supplied, message)) return true;
  }
  return false;
}

function sourceValues(lead: LeadRecord): Record<WebhookSourceField, string | null> {
  return {
    receivedAt: lead.receivedAt,
    intent: lead.intent,
    name: lead.name,
    email: lead.email,
    organization: lead.organization,
    productId: lead.productId,
    sourceOrigin: lead.sourceOrigin,
    pagePath: lead.pagePath,
    message: lead.message,
    locale: lead.locale,
  };
}

export function buildWebhookBody(lead: LeadRecord, deliveryId: string, mapping: WebhookFieldMapping): string {
  const values = sourceValues(lead);
  const mapped: Record<string, string> = {};
  for (const [source, destination] of Object.entries(mapping) as Array<[WebhookSourceField, string]>) {
    const value = values[source];
    if (value !== null) mapped[destination] = value;
  }
  return JSON.stringify({
    delivery_id: deliveryId,
    event_version: WEBHOOK_EVENT_VERSION,
    received_at: lead.receivedAt,
    ...mapped,
  });
}

export async function deliverWebhook(input: {
  config: WebhookConfig;
  lead: LeadRecord;
  deliveryId: string;
  fetchImpl: typeof fetch;
  now: () => number;
}): Promise<DeliveryResult> {
  const started = Date.now();
  if (!input.config.configured || !input.config.url || !input.config.secret) {
    return { outcome: "permanent", errorCategory: "config_error", durationMs: Math.max(0, Date.now() - started) };
  }

  const rawBody = buildWebhookBody(input.lead, input.deliveryId, input.config.mapping);
  const timestamp = Math.floor(input.now() / 1_000).toString();
  const signature = await signWebhook(input.config.secret, timestamp, rawBody);
  const previousSignature = input.config.previousSecret
    ? await signWebhook(input.config.previousSecret, timestamp, rawBody)
    : undefined;

  try {
    const response = await input.fetchImpl(input.config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DigiTracks-Delivery-Id": input.deliveryId,
        "X-DigiTracks-Timestamp": timestamp,
        "X-DigiTracks-Version": WEBHOOK_EVENT_VERSION,
        "X-DigiTracks-Signature": signature,
        ...(previousSignature ? { "X-DigiTracks-Signature-Previous": previousSignature } : {}),
      },
      body: rawBody,
      redirect: "manual",
      signal: AbortSignal.timeout(input.config.timeoutMs),
    });
    if (response.status >= 200 && response.status < 300) {
      return { outcome: "accepted", httpStatus: response.status, errorCategory: "acknowledged", durationMs: Math.max(0, Date.now() - started) };
    }
    const retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
    return {
      outcome: retryable ? "retryable" : "permanent",
      httpStatus: response.status,
      errorCategory: response.status >= 300 && response.status < 400 ? "redirect_not_allowed" : retryable ? "receiver_unavailable" : "receiver_rejected",
      durationMs: Math.max(0, Date.now() - started),
    };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      outcome: "retryable",
      errorCategory: timedOut ? "timeout" : "network_error",
      durationMs: Math.max(0, Date.now() - started),
    };
  }
}

export function demoToken(): { token: string; hashPromise: Promise<string>; signatureSuffix: (expiresAt: number, secret: string) => Promise<string> } {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64url(bytes);
  return {
    token,
    hashPromise: crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)).then((digest) =>
      [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
    ),
    signatureSuffix: async (expiresAt, secret) => {
      const signature = await signWebhook(secret, token, expiresAt.toString());
      return `${expiresAt}.${signature}`;
    },
  };
}
