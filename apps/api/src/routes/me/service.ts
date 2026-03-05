import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { HTTPException } from "hono/http-exception";
import { MeRepository } from "./repository";
import type {
  GetMeResponse,
  PatchMeJsonSchema,
  PatchMeResponse,
} from "./schemas";

export class MeService {
  repository: MeRepository;
  constructor(db: PostgresJsDatabase) {
    this.repository = new MeRepository(db);
  }

  async getMe(id: string): Promise<GetMeResponse> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }
    return {
      data: {
        me: {
          id: user.id,
          name: user.name,
        },
      },
    };
  }

  async patchMe(id: string, json: PatchMeJsonSchema): Promise<PatchMeResponse> {
    const user = await this.repository.update(id, json);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }
    return {
      data: {
        me: {
          id: user.id,
          name: user.name,
        },
      },
    };
  }

  async deleteMe(id: string): Promise<void> {
    const user = await this.repository.delete(id);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }
  }
}
