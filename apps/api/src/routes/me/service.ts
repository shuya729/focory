import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { HTTPException } from "hono/http-exception";
import { UserRepository } from "./repository";
import type { GetMeResponse, PutMeJsonSchema, PutMeResponse } from "./schemas";

export class MeService {
  repository: UserRepository;
  constructor(db: PostgresJsDatabase) {
    this.repository = new UserRepository(db);
  }

  async getMe(authId: string): Promise<GetMeResponse> {
    const user = await this.repository.findByAuthId(authId);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }
    return {
      data: {
        me: {
          id: user.id,
          name: user.name,
          object: user.object
            ? {
                id: user.object.id,
                key: user.object.key,
              }
            : null,
        },
      },
    };
  }

  async putMe(authId: string, json: PutMeJsonSchema): Promise<PutMeResponse> {
    const object = await this.repository.findAvailableUserObjectByObjectId(
      json.objectId
    );
    if (!object) {
      throw new HTTPException(404, { message: "Object not found" });
    }
    const user = await this.repository.upsert({
      authId,
      name: json.name,
      objectId: object.id,
    });
    if (!user) {
      throw new HTTPException(500, { message: "Internal server error" });
    }
    return {
      data: {
        me: {
          id: user.id,
          name: user.name,
          object: user.object
            ? {
                id: user.object.id,
                key: user.object.key,
              }
            : null,
        },
      },
    };
  }

  async deleteMe(authId: string): Promise<void> {
    const user = await this.repository.delete(authId);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }
  }
}
