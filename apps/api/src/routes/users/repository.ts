import { and, asc, eq, gt, like } from "drizzle-orm/pg-core/expressions";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { HTTPException } from "hono/http-exception";
import { users } from "../../lib/db/schema";
import type { User } from "../../schemas/user";

export interface UserRepositoryInterface {
  findById(id: string): Promise<User | undefined>;
  search({
    q,
    cursor,
    limit,
  }: {
    q?: string;
    cursor?: string;
    limit: number;
  }): Promise<User[]>;
}

export class UserRepository implements UserRepositoryInterface {
  db: PostgresJsDatabase;
  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  async findById(id: string): Promise<User | undefined> {
    try {
      const rows = await this.db
        .select({
          id: users.id,
          name: users.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }

  async search({
    q,
    cursor,
    limit,
  }: {
    q?: string;
    cursor?: string;
    limit: number;
  }): Promise<User[]> {
    const query = this.db
      .select({
        id: users.id,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    if (q && cursor) {
      query.where(and(like(users.name, `${q}%`), gt(users.id, cursor)));
    } else if (q) {
      query.where(like(users.name, `${q}%`));
    } else if (cursor) {
      query.where(gt(users.id, cursor));
    }

    query.orderBy(asc(users.id)).limit(limit);

    try {
      const rows = await query;
      return rows;
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }
}
