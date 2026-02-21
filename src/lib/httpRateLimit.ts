/**
 * HTTP route rate limiting via Upstash Redis.
 *
 * Requires env vars in Vercel/local:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * If the env vars are absent (local dev without Redis), all requests pass through.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

function makeLimiter(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  });
}

/** 5 per minute — Stripe checkout, auth signup (expensive ops) */
export const strictLimiter = makeLimiter(5, "1 m");

/** 30 per minute — search, export, general authenticated routes */
export const defaultLimiter = makeLimiter(30, "1 m");

/**
 * Check a rate limit for the incoming request.
 * Returns a 429 NextResponse if the limit is exceeded, otherwise null.
 * Keyed by IP address.
 */
export async function checkHttpRateLimit(
  request: Request,
  limiter: Ratelimit | null
): Promise<NextResponse | null> {
  if (!limiter) return null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  return null;
}
