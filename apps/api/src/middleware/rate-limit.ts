import { Ratelimit } from "@upstash/ratelimit";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { RedisClient } from "../lib/redis/client";

interface RateLimitOptions {
  limit: number;
  window: Parameters<typeof Ratelimit.slidingWindow>[1];
  prefix: string;
}

export interface RateLimitVariables {
  rc: RedisClient;
  userId: string;
}

export const createRateLimit = ({ limit, window, prefix }: RateLimitOptions) =>
  createMiddleware<{ Variables: RateLimitVariables }>(async (c, next) => {
    const limiter = new Ratelimit({
      redis: c.get("rc"),
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix,
      analytics: false,
      ephemeralCache: false,
    });

    const result = await limiter.limit(c.get("userId"));
    if (result.reason === "timeout") {
      throw new Error("Rate limit check timed out");
    }
    if (!result.success) {
      throw new HTTPException(429, { message: "Too many requests" });
    }
    await next();
  });
