import { env } from "node:process";
import { expo } from "@better-auth/expo";
import type { Redis } from "@upstash/redis/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v7 } from "uuid";
import schema from "../db/schema";

export const getAuth = (db: PostgresJsDatabase, redis: Redis) =>
  betterAuth({
    basePath: "/auth",
    advanced: {
      database: {
        generateId: () => v7(),
      },
    },
    database: drizzleAdapter(db, {
      schema,
      provider: "pg",
      usePlural: true,
    }),
    plugins: [expo(), anonymous()],
    secondaryStorage: {
      get: async (key) => await redis.get(key),
      set: async (key, value, ttl) =>
        ttl
          ? await redis.set(key, value, { ex: ttl })
          : await redis.set(key, value),
      delete: async (key) => {
        await redis.del(key);
      },
    },
    trustedOrigins: [env.TRUSTED_ORIGIN],
  });
