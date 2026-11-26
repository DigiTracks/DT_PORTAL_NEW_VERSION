import type { ApproximateRateLimiter, RateLimitDecision } from "./types";

/** Fixed-window, per-isolate abuse control. It is intentionally not a global quota. */
export class IsolateRateLimiter implements ApproximateRateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();
  private readonly maximumBuckets = 10_000;

  check({ key, limit, windowSeconds, now }: { key: string; limit: number; windowSeconds: number; now: number }): RateLimitDecision {
    const resetAt = now + windowSeconds * 1_000;
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (this.buckets.size >= this.maximumBuckets) {
        for (const [candidate, existing] of this.buckets) {
          if (existing.resetAt <= now) this.buckets.delete(candidate);
        }
        if (this.buckets.size >= this.maximumBuckets) this.buckets.delete(this.buckets.keys().next().value!);
      }
      bucket = { count: 0, resetAt };
      this.buckets.set(key, bucket);
    }
    if (bucket.count >= limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)) };
    }
    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
