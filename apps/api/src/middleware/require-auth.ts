import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { ClientsVariables } from "./with-clients";

export interface RequireAuthVariables extends ClientsVariables {
  userId: string;
}

const requireAuth = createMiddleware<{
  Variables: RequireAuthVariables;
}>(async (c, next) => {
  const session = await c.get("ac").api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  c.set("userId", session.user.id);
  await next();
});

export default requireAuth;
