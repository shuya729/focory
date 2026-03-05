import { Redis } from "@upstash/redis/cloudflare";

export const getRedis = (env: CloudflareBindings) =>
  Redis.fromEnv({
    UPSTASH_REDIS_REST_URL: env.REDIS_URL,
    UPSTASH_REDIS_REST_TOKEN: env.REDIS_TOKEN,
  });
