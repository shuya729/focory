import type { Redis } from "@upstash/redis/cloudflare";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createMiddleware } from "hono/factory";
import { getDb } from "../lib/db/client";
import { getRedis } from "../lib/redis/client";

export interface ClientsVariables {
  dc: PostgresJsDatabase;
  rc: Redis;
}

const withClients = createMiddleware<{
  Bindings: CloudflareBindings;
  Variables: ClientsVariables;
}>(async (c, next) => {
  const dc = getDb(c.env);
  const rc = getRedis(c.env);
  c.set("dc", dc);
  c.set("rc", rc);
  await next();
});

export default withClients;
