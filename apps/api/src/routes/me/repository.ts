import { eq } from "drizzle-orm/pg-core/expressions";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { HTTPException } from "hono/http-exception";
import { users } from "../../lib/db/schema";
import type { User } from "../../schemas/user";

export interface MeRepositoryInterface {
  findById(id: string): Promise<User | undefined>;
  update(id: string, value: { name: string }): Promise<User | undefined>;
  delete(id: string): Promise<User | undefined>;
}

export class MeRepository implements MeRepositoryInterface {
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

  async update(id: string, value: { name: string }): Promise<User | undefined> {
    try {
      const rows = await this.db
        .update(users)
        .set({ name: value.name, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          name: users.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }

  async delete(id: string): Promise<User | undefined> {
    try {
      const rows = await this.db
        .delete(users)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          name: users.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }
}
