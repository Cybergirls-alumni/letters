import { NextResponse, type NextRequest } from "next/server";

// Best-effort in-memory limiter. State lives per serverless instance, so this only
// slows casual abuse — put Cloudflare or Vercel WAF rate limiting in front for real protection.
const MAX_BUCKETS = 5000;
const SWEEP_INTERVAL_MS = 60 * 1000;
const buckets = new Map<string, { count: number; resetAt: number }>();
let lastSweep = 0;

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Counts a hit against `key`; returns true once the caller is over the limit. */
export function hitLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  // Bound memory: sweep expired entries at most once a minute, then evict the oldest if still full
  if (buckets.size >= MAX_BUCKETS && now - lastSweep > SWEEP_INTERVAL_MS) {
    lastSweep = now;
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) {
    buckets.delete(buckets.keys().next().value!);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count++;
  return bucket.count > max;
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function rateLimit(
  req: NextRequest,
  scope: string,
  max: number,
  windowMs: number
): NextResponse | null {
  if (!hitLimit(`${scope}:${clientIp(req.headers)}`, max, windowMs)) return null;
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 }
  );
}
