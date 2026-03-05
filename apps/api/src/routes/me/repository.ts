import { and, eq } from "drizzle-orm/pg-core/expressions";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { HTTPException } from "hono/http-exception";
import { objects, users } from "../../lib/db/schema";
import type { Object as ObjectType } from "../../schemas/object";
import type { User } from "../../schemas/user";

export interface UserRepositoryInterface {
  findByAuthId(authId: string): Promise<User | undefined>;
  findAvailableUserObjectByObjectId(
    objectId: string
  ): Promise<ObjectType | undefined>;
  upsert(value: {
    authId: string;
    name: string;
    objectId: string;
  }): Promise<User | undefined>;
  delete(authId: string): Promise<User | undefined>;
}

export class UserRepository implements UserRepositoryInterface {
  db: PostgresJsDatabase;
  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  async findByAuthId(authId: string): Promise<User | undefined> {
    try {
      const rows = await this.db
        .select({
          id: users.id,
          name: users.name,
          objectId: users.objectId,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          object: objects,
        })
        .from(users)
        .leftJoin(
          objects,
          and(
            eq(users.objectId, objects.id),
            eq(objects.type, "user"),
            eq(objects.status, "available")
          )
        )
        .where(eq(users.authId, authId))
        .limit(1);
      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }

  async findAvailableUserObjectByObjectId(
    objectId: string
  ): Promise<ObjectType | undefined> {
    try {
      const rows = await this.db
        .select({
          id: objects.id,
          key: objects.key,
          type: objects.type,
          status: objects.status,
          contentType: objects.contentType,
          createdAt: objects.createdAt,
          updatedAt: objects.updatedAt,
        })
        .from(objects)
        .where(
          and(
            eq(objects.id, objectId),
            eq(objects.type, "user"),
            eq(objects.status, "available")
          )
        )
        .limit(1);
      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }

  async upsert(value: {
    authId: string;
    name: string;
    objectId: string;
  }): Promise<User | undefined> {
    try {
      const rows = await this.db
        .insert(users)
        .values({ ...value })
        .onConflictDoUpdate({
          target: [users.authId],
          set: { ...value, updatedAt: new Date() },
        })
        .returning({
          id: users.id,
          name: users.name,
          objectId: users.objectId,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }

  async delete(authId: string): Promise<User | undefined> {
    try {
      const rows = await this.db
        .delete(users)
        .where(eq(users.authId, authId))
        .returning({
          id: users.id,
          name: users.name,
          objectId: users.objectId,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }
}
