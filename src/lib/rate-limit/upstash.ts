import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getTotalProcessedSize } from "./index"; // Keep existing functions
import { UserTier } from "../credits/check";

// Initialize Upstash Redis
const redis = Redis.fromEnv();

// Create different rate limiters for different tiers
const unverifiedRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 requests per hour
  analytics: true,
});

const verifiedRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 requests per hour
  analytics: true,
});

const proRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(50, "1 h"), // 50 requests per hour
  analytics: true,
});

// Monthly limit checker using Redis
interface MonthlyLimitKey {
  identifier: string;
  tier: UserTier;
}

/**
 * Distributed rate limiting middleware using Upstash Redis
 * Replaces the memory-based implementation for production use
 */
export async function upstashRateLimitMiddleware(
  request: NextRequest,
  options: {
    identifier: string;
    tier?: UserTier;
  }
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  const { identifier } = options;
  const tier = options.tier || "unverified";

  // Select rate limiter based on tier
  const ratelimit =
    tier === "pro"
      ? proRatelimit
      : tier === "verified"
      ? verifiedRatelimit
      : unverifiedRatelimit;

  // Check rate limit
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

  if (!success) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `已达到速率限制。请等待 ${Math.ceil(
            (reset - Date.now()) / 1000 / 60
          )} 分钟后再试。`,
          limit,
          remaining: 0,
          resetTime: reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      ),
      limit,
      remaining: 0,
      resetTime: reset,
    };
  }

  return {
    allowed: true,
    response: undefined,
    limit,
    remaining,
    resetTime: reset,
  };
}

/**
 * Check monthly processing limit using Redis
 * Stores counts with expiration (resets monthly)
 */
export async function checkMonthlyLimitRedis(
  identifier: string,
  tier: UserTier = "unverified"
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Key for monthly count
  const key = `processing:${identifier}:${now.getFullYear()}:${now.getMonth()}`;

  // Get current count (or initialize)
  const current = (await redis.get<number>(key)) || 0;

  // Get tier limits
  const limits = {
    unverified: 3,
    verified: 10,
    pro: Infinity,
  };

  const limit = limits[tier];
  const remaining = Math.max(0, limit - current);

  return {
    allowed: current < limit,
    current,
    limit,
    remaining,
  };
}

/**
 * Increment monthly processing count
 */
export async function incrementMonthlyCount(identifier: string): Promise<number> {
  const now = new Date();

  // Key includes year and month for automatic reset
  const key = `processing:${identifier}:${now.getFullYear()}:${now.getMonth()}`;

  // Get days remaining in month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate() + 1;
  const expirationSeconds = daysRemaining * 24 * 60 * 60;

  // Increment counter
  const count = await redis.incr(key);

  // Set expiration on first increment
  if (count === 1) {
    await redis.expire(key, expirationSeconds);
  }

  return count;
}
