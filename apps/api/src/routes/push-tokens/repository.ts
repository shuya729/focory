import { eq } from "drizzle-orm/pg-core/expressions";
import type { DbClient } from "../../lib/db/client";
import { pushTokens } from "../../lib/db/schema";

import type { PushTokensRepositoryInterface, StoredPushToken } from "./types";

export class PushTokensRepository implements PushTokensRepositoryInterface {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async upsert(
    userId: string,
    token: string
  ): Promise<StoredPushToken | undefined> {
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
  }

  async findByUserId(userId: string): Promise<StoredPushToken[]> {
    return await this.db
      .select({
        token: pushTokens.token,
        userId: pushTokens.userId,
        createdAt: pushTokens.createdAt,
        updatedAt: pushTokens.updatedAt,
      })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
  }

  async deleteByToken(token: string): Promise<StoredPushToken | undefined> {
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
  }
}
