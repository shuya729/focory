import { createMiddleware } from "hono/factory";
import type { ClientsVariables } from "./with-clients";

export interface OptionalAuthVariables extends ClientsVariables {
  authId?: string;
}

const optionalAuth = createMiddleware<{
  Variables: OptionalAuthVariables;
}>(async (c, next) => {
  const state = await c.get("ac").authenticateRequest(c.req.raw);
  c.set("authId", state.toAuth()?.userId ?? undefined);
  await next();
});

export default optionalAuth;
