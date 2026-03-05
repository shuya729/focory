import { eq } from "drizzle-orm/pg-core/expressions";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { users } from "../lib/db/schema";
import type { RequireAuthVariables } from "./require-auth";

export interface RequireUserVariables extends RequireAuthVariables {
  userId: string;
}

const findUserByAuthId = async (
  dc: PostgresJsDatabase,
  { authId }: { authId: string }
) => {
  try {
    const user = await dc
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, authId))
      .limit(1);
    return user.length > 0 ? user[0] : null;
  } catch (cause) {
    throw new HTTPException(500, { message: "Internal server error", cause });
  }
};

const getUserId = async (
  dc: PostgresJsDatabase,
  { authId }: { authId: string }
) => {
  const user = await findUserByAuthId(dc, { authId });
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return user.id;
};

const requireUser = createMiddleware<{
  Variables: RequireUserVariables;
}>(async (c, next) => {
  const dc = c.get("dc");
  const authId = c.get("authId");
  const userId = await getUserId(dc, { authId });
  c.set("userId", userId);
  await next();
});

export default requireUser;
