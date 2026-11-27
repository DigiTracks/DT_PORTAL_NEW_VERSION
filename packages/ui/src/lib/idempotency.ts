export interface IdempotencyState {
  key: string;
  fingerprint: string;
}

/** Stable identity of a lead payload, ignoring the single-use Turnstile token. */
export function payloadFingerprint(payload: object): string {
  const { turnstileToken: _turnstileToken, ...stable } = payload as Record<string, unknown>;
  return JSON.stringify(stable);
}

/**
 * Returns the key to send. A retry of the same payload reuses the current key so
 * the server can de-duplicate an ambiguous first attempt; a new payload gets a new key.
 */
export function resolveIdempotencyState(
  current: IdempotencyState | null,
  fingerprint: string,
  createKey: () => string = () => crypto.randomUUID(),
): IdempotencyState {
  if (current && current.fingerprint === fingerprint) return current;
  return { key: createKey(), fingerprint };
}

/**
 * Whether the key must survive the response. Network failures leave the key untouched
 * (outcome unknown). A 409 or 5xx may still be a duplicate in flight, so keep it too.
 * Any other response is definitive, so the next submit starts fresh.
 */
export function keepsIdempotencyKey(status: number): boolean {
  return status === 409 || status >= 500;
}
