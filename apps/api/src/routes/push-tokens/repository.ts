import { eq } from "drizzle-orm/pg-core/expressions";
import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import { pushTokens } from "../../lib/db/schema";

export interface StoredPushToken {
  token: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushTokensRepositoryInterface {
  upsert(userId: string, token: string): Promise<StoredPushToken | undefined>;
  findByUserId(userId: string): Promise<StoredPushToken[]>;
  deleteByToken(token: string): Promise<StoredPushToken | undefined>;
}

export class PushTokensRepository implements PushTokensRepositoryInterface {
  db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async upsert(
    userId: string,
    token: string
  ): Promise<StoredPushToken | undefined> {
    try {
      const updatedAt = new Date();
      const rows = await this.db
        .insert(pushTokens)
        .values({
          token,
          userId,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: pushTokens.token,
          set: {
            userId,
            updatedAt,
          },
        })
        .returning({
          token: pushTokens.token,
          userId: pushTokens.userId,
          createdAt: pushTokens.createdAt,
          updatedAt: pushTokens.updatedAt,
        });

      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }

  async findByUserId(userId: string): Promise<StoredPushToken[]> {
    try {
      return await this.db
        .select({
          token: pushTokens.token,
          userId: pushTokens.userId,
          createdAt: pushTokens.createdAt,
          updatedAt: pushTokens.updatedAt,
        })
        .from(pushTokens)
        .where(eq(pushTokens.userId, userId));
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }

  async deleteByToken(token: string): Promise<StoredPushToken | undefined> {
    try {
      const rows = await this.db
        .delete(pushTokens)
        .where(eq(pushTokens.token, token))
        .returning({
          token: pushTokens.token,
          userId: pushTokens.userId,
          createdAt: pushTokens.createdAt,
          updatedAt: pushTokens.updatedAt,
        });

      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }
}
