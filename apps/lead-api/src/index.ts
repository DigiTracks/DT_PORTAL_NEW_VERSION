import { trackFromEnv } from "./analytics";
import { readConfig } from "./config";
import { consumeBatch, runScheduledRepair } from "./consumer";
import { issueDemoGrant, redeemDemoGrant, revokeDemoGrant } from "./demo";
import { submitBrowserEvent } from "./events";
import {
  HttpError,
  clientRateKey,
  corsHeaders,
  errorResponse,
  exactOrigin,
  jsonResponse,
  readJsonBody,
  redactConfigForHealth,
  securityHeaders,
} from "./http";
import { storeLead } from "./leads";
import { IsolateRateLimiter } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";
import type { Env, ExecutionContext, MessageBatch, ScheduledController, WorkerDependencies } from "./types";
import { validIdempotencyHeader, validateLeadPayload } from "./validation";

const isolateRateLimiter = new IsolateRateLimiter();

export async function submitLead(request: Request, env: Env, dependencies: WorkerDependencies = {}): Promise<Response> {
  const config = readConfig(env);
  if (request.method === "OPTIONS") {
    const origin = exactOrigin(request, config.allowedOrigins);
    return new Response(null, {
      status: 204,
      headers: { ...securityHeaders(), ...corsHeaders(origin) },
    });
  }
  if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "Only POST is supported.");
  const origin = exactOrigin(request, config.allowedOrigins);
  if (config.turnstile.state !== "configured") {
    throw new HttpError(503, "turnstile_unconfigured", "Bot verification is not configured.");
  }
  const db = env.DB;
  const queue = env.LEAD_QUEUE;
  if (!db) throw new HttpError(503, "storage_unavailable", "The request could not be saved.");
  if (!queue) throw new HttpError(503, "queue_unavailable", "The delivery queue is not configured.");

  const now = dependencies.now?.() ?? Date.now();
  const decision = (dependencies.rateLimiter ?? isolateRateLimiter).check({
    key: `lead:${origin}:${clientRateKey(request)}`,
    limit: config.rateLimitPerMinute,
    windowSeconds: config.rateLimitWindowSeconds,
    now,
  });
  if (!decision.allowed) {
    throw new HttpError(429, "rate_limited", "Too many requests. Please try again later.", {
      "Retry-After": String(decision.retryAfterSeconds),
    });
  }

  const idempotencyKey = validIdempotencyHeader(request.headers.get("idempotency-key"));
  if (!idempotencyKey) {
    throw new HttpError(400, "invalid_idempotency_key", "A valid idempotency key is required.");
  }

  const payload = await readJsonBody(request);
  const validation = validateLeadPayload(payload, origin, config.allowedOrigins);
  if (!validation.ok || !validation.value) {
    return jsonResponse(
      { error: { code: "invalid_payload", message: "The request is invalid.", fields: validation.fields } },
      400,
      origin,
    );
  }
  if (validation.value.honeypot !== "") {
    // Do not disclose which automated-abuse control rejected the request.
    throw new HttpError(400, "invalid_request", "The request is invalid.");
  }

  let verified = false;
  try {
    verified = await (dependencies.turnstileVerifier ?? verifyTurnstile)(
      validation.value.turnstileToken,
      config.turnstile,
      dependencies.fetchImpl ?? fetch,
    );
  } catch {
    verified = false;
  }
  if (!verified) throw new HttpError(403, "bot_verification_failed", "The request could not be verified.");

  let stored: Awaited<ReturnType<typeof storeLead>>;
  try {
    stored = await storeLead({
      db,
      lead: {
        intent: validation.value.intent,
        name: validation.value.name,
        email: validation.value.email,
        organization: validation.value.organization,
        productId: validation.value.productId,
        sourceOrigin: validation.value.sourceOrigin,
        pagePath: validation.value.pagePath,
        message: validation.value.message,
        consent: 1,
        locale: validation.value.locale,
      },
      idempotencyHeader: idempotencyKey,
      emailMaxAttempts: config.email.maxAttempts,
      webhookMaxAttempts: config.webhook.maxAttempts,
      now,
    });
  } catch {
    throw new HttpError(503, "storage_unavailable", "The request could not be saved.");
  }
  if ("conflict" in stored) {
    throw new HttpError(409, "idempotency_conflict", "This idempotency key was used for a different request.");
  }

  let delivery: "unknown" | "queued" | "pending_repair" = "unknown";
  if (!stored.duplicate) {
    const queued = await Promise.allSettled(
      stored.outboxIds.map((outboxId) => Promise.resolve().then(() => queue.send({ outboxId }, { contentType: "application/json" }))),
    );
    delivery = stored.outboxIds.length === 2 && queued.every((result) => result.status === "fulfilled")
      ? "queued"
      : "pending_repair";
    await trackFromEnv(env, "lead_received", {
      intent: validation.value.intent,
      productId: validation.value.productId,
      correlationId: stored.leadId,
    });
  }

  return jsonResponse(
    {
      status: "received",
      receiptId: stored.receiptId,
      duplicate: stored.duplicate,
      delivery,
      message: "Your request was received. Email and CRM delivery are asynchronous and not yet confirmed.",
    },
    202,
    origin,
  );
}

function methodNotAllowed(allow: string): Response {
  return errorResponse(new HttpError(405, "method_not_allowed", "The method is not allowed.", { Allow: allow }));
}

async function dispatch(request: Request, env: Env, dependencies: WorkerDependencies): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";
  const now = dependencies.now?.() ?? Date.now();

  if (path === "/api/lead/health") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    const ready = Boolean(env.DB && env.LEAD_QUEUE && readConfig(env).turnstile.state === "configured");
    return jsonResponse({ status: ready ? "ready" : "degraded", ...redactConfigForHealth(env) }, ready ? 200 : 503);
  }
  if (path === "/api/lead") return submitLead(request, env, dependencies);
  if (path === "/api/events") return submitBrowserEvent(request, env, dependencies);
  if (path === "/api/demo/redeem") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    try {
      return await redeemDemoGrant(request, env, now);
    } catch {
      throw new HttpError(503, "storage_unavailable", "Demo access could not be checked.");
    }
  }
  if (path === "/api/demo/issue") {
    if (request.method !== "POST") return methodNotAllowed("POST");
    try {
      return await issueDemoGrant(request, env, now);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, "storage_unavailable", "Demo access could not be issued.");
    }
  }
  const revoke = /^\/api\/demo\/grants\/([^/]+)\/revoke$/.exec(path);
  if (revoke) {
    if (request.method !== "POST") return methodNotAllowed("POST");
    try {
      return await revokeDemoGrant(request, env, revoke[1], now);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, "storage_unavailable", "Demo access could not be revoked.");
    }
  }
  throw new HttpError(404, "not_found", "The endpoint was not found.");
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext, dependencies: WorkerDependencies = {}): Promise<Response> {
    const origin = request.headers.get("origin");
    const corsOrigin = origin && readConfig(env).allowedOrigins.has(origin) ? origin : undefined;
    try {
      return await dispatch(request, env, dependencies);
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error, corsOrigin);
      return errorResponse(new HttpError(500, "internal_error", "The request could not be completed."), corsOrigin);
    }
  },
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    await consumeBatch(batch, env);
  },
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    await runScheduledRepair(controller, env);
  },
};
