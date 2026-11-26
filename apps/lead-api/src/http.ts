import { LEAD_BODY_CAP_BYTES } from "./config";
import type { Env } from "./types";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly publicMessage: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(publicMessage);
  }
}

export function securityHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key",
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function jsonResponse(
  body: unknown,
  status: number,
  origin?: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...securityHeaders(),
      "Content-Type": "application/json; charset=utf-8",
      ...(origin ? corsHeaders(origin) : {}),
      ...extraHeaders,
    },
  });
}

export function errorResponse(error: HttpError, origin?: string): Response {
  const headers = { ...error.headers };
  if (error.status === 405 && !headers.Allow) headers.Allow = "POST";
  return jsonResponse({ error: { code: error.code, message: error.publicMessage } }, error.status, origin, headers);
}

export async function readJsonBody(request: Request, maximumBytes = LEAD_BODY_CAP_BYTES): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    if (!/^(0|[1-9][0-9]*)$/.test(declared)) {
      throw new HttpError(400, "invalid_content_length", "The request length is invalid.");
    }
    if (Number(declared) > maximumBytes) {
      throw new HttpError(413, "payload_too_large", "The request is too large.");
    }
  }

  const contentType = request.headers.get("content-type")?.toLowerCase();
  if (!contentType || !/^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?\s*$/.test(contentType)) {
    throw new HttpError(415, "unsupported_media_type", "JSON is required.");
  }
  const encoding = request.headers.get("content-encoding");
  if (encoding && encoding.toLowerCase() !== "identity") {
    throw new HttpError(415, "unsupported_content_encoding", "The request encoding is not supported.");
  }
  if (!request.body) throw new HttpError(400, "invalid_json", "The request body must be JSON.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel().catch(() => undefined);
        throw new HttpError(413, "payload_too_large", "The request is too large.");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "invalid_body", "The request body could not be read.");
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let raw: string;
  try {
    raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be UTF-8 JSON.");
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be valid JSON.");
  }
}

export function exactOrigin(request: Request, allowedOrigins: ReadonlySet<string>): string {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins.has(origin)) {
    throw new HttpError(403, "origin_not_allowed", "This origin is not allowed.");
  }
  return origin;
}

export function clientRateKey(request: Request): string {
  // Cloudflare sets this header at the edge. X-Forwarded-For is deliberately not trusted.
  return request.headers.get("cf-connecting-ip")?.trim() || "local";
}

export function redactConfigForHealth(env: Env): Record<string, boolean> {
  return {
    d1Binding: Boolean(env.DB),
    queueBinding: Boolean(env.LEAD_QUEUE),
    analyticsBinding: Boolean(env.ANALYTICS),
  };
}
