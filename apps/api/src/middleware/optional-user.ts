import { eq } from "drizzle-orm/pg-core/expressions";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { users } from "../lib/db/schema";
import type { OptionalAuthVariables } from "./optional-auth";

export interface OptionalUserVariables extends OptionalAuthVariables {
  userId?: string;
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
  { authId }: { authId?: string }
) => {
  if (!authId) {
    return undefined;
  }
  const user = await findUserByAuthId(dc, { authId });
  return user?.id;
};

const optionalUser = createMiddleware<{
  Variables: OptionalUserVariables;
}>(async (c, next) => {
  const dc = c.get("dc");
  const authId = c.get("authId");
  const userId = await getUserId(dc, { authId });
  c.set("userId", userId);
  await next();
});

export default optionalUser;
