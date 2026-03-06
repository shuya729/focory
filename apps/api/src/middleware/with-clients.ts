import { createMiddleware } from "hono/factory";
import { type AuthClient, getAuth } from "../lib/auth/client";
import { type DbClient, getDb } from "../lib/db/client";
import { getRedis, type RedisClient } from "../lib/redis/client";

export interface ClientsVariables {
  ac: AuthClient;
  dc: DbClient;
  rc: RedisClient;
}

const withClients = createMiddleware<{
  Bindings: CloudflareBindings;
  Variables: ClientsVariables;
}>(async (c, next) => {
  const dc = getDb(c.env);
  const rc = getRedis(c.env);
  const ac = getAuth(dc, rc);
  c.set("ac", ac);
  c.set("dc", dc);
  c.set("rc", rc);
  await next();
});

export default withClients;
