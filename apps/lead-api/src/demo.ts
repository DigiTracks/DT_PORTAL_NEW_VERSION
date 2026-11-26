import { trackFromEnv } from "./analytics";
import { ADMIN_TOKEN_MIN_LENGTH, SIGNING_SECRET_MIN_LENGTH, readConfig, type DemoConfig } from "./config";
import { isDemoProductId } from "./contracts";
import { HttpError, jsonResponse, readJsonBody, securityHeaders } from "./http";
import type { D1Database, Env } from "./types";
import { demoToken } from "./webhook";

interface DemoGrantRow {
  id: string;
  product_id: string;
  expires_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
}

function grantId(): string {
  return `grant_${crypto.randomUUID().replaceAll("-", "")}`;
}

function iso(now: number): string {
  return new Date(now).toISOString();
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function secureEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([sha256Hex(left), sha256Hex(right)]);
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) difference |= leftHash.charCodeAt(index) ^ rightHash.charCodeAt(index);
  return difference === 0;
}

function requireOperatorConfig(config: DemoConfig): void {
  if (
    !config.configured ||
    !config.adminToken ||
    config.adminToken.length < ADMIN_TOKEN_MIN_LENGTH ||
    !config.signingSecret ||
    config.signingSecret.length < SIGNING_SECRET_MIN_LENGTH ||
    config.destinations.size === 0
  ) {
    throw new HttpError(503, "operator_access_unconfigured", "Operator access is not configured.");
  }
}

async function requireOperator(request: Request, config: DemoConfig): Promise<void> {
  requireOperatorConfig(config);
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match || !(await secureEqual(match[1], config.adminToken!))) {
    throw new HttpError(401, "unauthorized", "Operator authorization is required.", { "WWW-Authenticate": "Bearer" });
  }
}

async function verifyDemoSignature(token: string, expiresAt: string, signature: string, secrets: readonly string[]): Promise<boolean> {
  if (!/^[0-9]{1,12}$/.test(expiresAt) || !/^v1=[a-f0-9]{64}$/.test(signature)) return false;
  const supplied = Uint8Array.from(signature.slice(3).match(/../g)!, (pair) => Number.parseInt(pair, 16));
  const message = new TextEncoder().encode(`${token}.${expiresAt}`);
  for (const secret of secrets) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (await crypto.subtle.verify("HMAC", key, supplied, message)) return true;
  }
  return false;
}

export async function issueDemoGrant(request: Request, env: Env, now: number): Promise<Response> {
  const config = readConfig(env).demo;
  await requireOperator(request, config);
  if (!env.DB) throw new HttpError(503, "storage_unavailable", "The request could not be saved.");

  const payload = await readJsonBody(request);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "invalid_request", "The request is invalid.");
  }
  const input = payload as Record<string, unknown>;
  const keys = Object.keys(input);
  if (keys.some((key) => !["productId", "leadId", "expiresInHours"].includes(key))) {
    throw new HttpError(400, "invalid_request", "The request is invalid.");
  }
  const productId = input.productId;
  if (typeof productId !== "string" || !isDemoProductId(productId)) {
    throw new HttpError(400, "invalid_product", "The product is invalid.");
  }
  const destination = config.destinations.get(productId);
  if (!destination) throw new HttpError(400, "demo_destination_unconfigured", "This product has no configured demo destination.");

  const leadId = input.leadId;
  if (leadId !== undefined && (typeof leadId !== "string" || !/^lead_[a-f0-9]{32}$/.test(leadId))) {
    throw new HttpError(400, "invalid_lead", "The lead reference is invalid.");
  }
  if (typeof leadId === "string") {
    const lead = await env.DB.prepare("SELECT id FROM leads WHERE id = ?").bind(leadId).first();
    if (!lead) throw new HttpError(400, "invalid_lead", "The lead reference is invalid.");
  }

  const expiresInHours = input.expiresInHours ?? config.ttlHours;
  if (!Number.isSafeInteger(expiresInHours) || (expiresInHours as number) < 1 || (expiresInHours as number) > 720) {
    throw new HttpError(400, "invalid_expiry", "The expiry is invalid.");
  }
  // Store the same second-precision expiry that is signed into the token.
  const expiresAtMs = Math.floor(now / 1_000) * 1_000 + (expiresInHours as number) * 3_600_000;
  const generated = demoToken();
  const [tokenHash, signatureSuffix] = await Promise.all([
    generated.hashPromise,
    generated.signatureSuffix(Math.floor(expiresAtMs / 1_000), config.signingSecret!),
  ]);
  const id = grantId();
  const timestamp = iso(now);
  await env.DB
    .prepare(
      `INSERT INTO demo_grants
        (id, token_hash, product_id, lead_id, expires_at, single_use, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    )
    .bind(id, tokenHash, productId, leadId ?? null, iso(expiresAtMs), timestamp, timestamp)
    .run();

  await trackFromEnv(env, "demo_access_issued", { productId, correlationId: id });
  return jsonResponse(
    {
      status: "issued",
      grantId: id,
      expiresAt: iso(expiresAtMs),
      redeemPath: `/api/demo/redeem?token=${generated.token}.${signatureSuffix}`,
    },
    201,
  );
}

export async function revokeDemoGrant(request: Request, env: Env, requestedId: string, now: number): Promise<Response> {
  const config = readConfig(env).demo;
  await requireOperator(request, config);
  if (!env.DB) throw new HttpError(503, "storage_unavailable", "The request could not be saved.");
  if (!/^grant_[a-f0-9]{32}$/.test(requestedId)) throw new HttpError(404, "not_found", "The access record was not found.");

  const timestamp = iso(now);
  const revoked = await env.DB
    .prepare<{ product_id: string }>(
      `UPDATE demo_grants SET revoked_at = ?, revocation_reason = 'operator_revoked', updated_at = ?
       WHERE id = ? AND revoked_at IS NULL RETURNING product_id`,
    )
    .bind(timestamp, timestamp, requestedId)
    .first();
  if (!revoked) {
    const existing = await env.DB.prepare("SELECT id FROM demo_grants WHERE id = ?").bind(requestedId).first();
    if (!existing) throw new HttpError(404, "not_found", "The access record was not found.");
    return jsonResponse({ status: "already_revoked", grantId: requestedId }, 200);
  }
  await trackFromEnv(env, "demo_access_revoked", {
    productId: revoked.product_id,
    correlationId: requestedId,
    reasonCategory: "operator_revoked",
  });
  return jsonResponse({ status: "revoked", grantId: requestedId }, 200);
}

function demoDenied(): Response {
  return jsonResponse(
    { error: { code: "demo_access_unavailable", message: "This demo access link is not available." } },
    404,
  );
}

export async function redeemDemoGrant(request: Request, env: Env, now: number): Promise<Response> {
  if (!env.DB) return demoDenied();
  const config = readConfig(env).demo;
  const secrets = [config.signingSecret, config.previousSigningSecret].filter(
    (secret): secret is string => Boolean(secret && secret.length >= SIGNING_SECRET_MIN_LENGTH),
  );
  if (secrets.length === 0 || config.destinations.size === 0) return demoDenied();

  const tokens = new URL(request.url).searchParams.getAll("token");
  if (tokens.length !== 1) return demoDenied();
  const parts = tokens[0].split(".");
  if (parts.length !== 3 || !/^[A-Za-z0-9_-]{43}$/.test(parts[0])) return demoDenied();
  const [token, expiresAtText, signature] = parts;
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1_000)) return demoDenied();
  if (!(await verifyDemoSignature(token, expiresAtText, signature, secrets))) return demoDenied();

  const tokenHash = await sha256Hex(token);
  const grant = await env.DB
    .prepare<DemoGrantRow>(
      `SELECT id, product_id, expires_at, redeemed_at, revoked_at FROM demo_grants WHERE token_hash = ?`,
    )
    .bind(tokenHash)
    .first();
  if (!grant || grant.revoked_at || grant.redeemed_at || grant.expires_at <= iso(now)) return demoDenied();
  if (grant.expires_at !== iso(expiresAt * 1_000)) return demoDenied();
  const destination = config.destinations.get(grant.product_id);
  if (!destination) return demoDenied();

  const timestamp = iso(now);
  const redeemed = await env.DB
    .prepare<{ product_id: string }>(
      `UPDATE demo_grants SET redeemed_at = ?, updated_at = ?
       WHERE id = ? AND redeemed_at IS NULL AND revoked_at IS NULL AND expires_at > ?
       RETURNING product_id`,
    )
    .bind(timestamp, timestamp, grant.id, timestamp)
    .first();
  if (!redeemed || redeemed.product_id !== grant.product_id) return demoDenied();

  return new Response(null, {
    status: 302,
    headers: {
      ...securityHeaders(),
      Location: destination,
    },
  });
}
