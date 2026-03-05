import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { ClientsVariables } from "./with-clients";

export interface RequireAuthVariables extends ClientsVariables {
  authId: string;
}

const requireAuth = createMiddleware<{
  Variables: RequireAuthVariables;
}>(async (c, next) => {
  const state = await c.get("ac").authenticateRequest(c.req.raw);
  if (!state.isAuthenticated) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  c.set("authId", state.toAuth().userId);
  await next();
});

export default requireAuth;
