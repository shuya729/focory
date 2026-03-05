import { createMiddleware } from "hono/factory";
import type { ClientsVariables } from "./with-clients";

export interface OptionalAuthVariables extends ClientsVariables {
  userId?: string;
}

const optionalAuth = createMiddleware<{
  Variables: OptionalAuthVariables;
}>(async (c, next) => {
  const session = await c.get("ac").api.getSession({
    headers: c.req.raw.headers,
  });
  c.set("userId", session?.user.id);
  await next();
});

export default optionalAuth;
