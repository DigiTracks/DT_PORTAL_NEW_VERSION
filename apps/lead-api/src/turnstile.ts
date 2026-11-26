import type { TurnstileConfig } from "./types";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string,
  config: TurnstileConfig,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret: config.secret, response: token });
    const response = await fetchImpl(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || Array.isArray(result)) return false;
    const verification = result as { success?: unknown; action?: unknown; hostname?: unknown };
    if (verification.success !== true) return false;
    if (verification.action !== config.expectedAction) return false;
    if (config.expectedHostnames.length === 0) return false;
    return (
      typeof verification.hostname === "string" &&
      config.expectedHostnames.includes(verification.hostname.toLowerCase())
    );
  } catch {
    // Network, timeout and malformed-provider failures are verification failures,
    // not permission to accept a lead without a bot check.
    return false;
  }
}
