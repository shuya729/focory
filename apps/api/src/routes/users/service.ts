import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import type { User } from "../../schemas/user";
import { UserRepository } from "./repository";
import type {
  GetUserResponse,
  GetUsersQuerySchema,
  GetUsersResponse,
} from "./schemas";

export class UsersService {
  repository: UserRepository;
  constructor(db: DbClient) {
    this.repository = new UserRepository(db);
  }

  async getUser(id: string): Promise<GetUserResponse> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }
    return {
      data: {
        user: {
          id: user.id,
          name: user.name,
        },
      },
    };
  }

  async getUsers(query: GetUsersQuerySchema): Promise<GetUsersResponse> {
    const users = await this.repository.search(query);
    return {
      data: {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
        })),
      },
      meta: {
        limit: query.limit,
        total: users.length,
        nextCursor: UsersService.getNextCursor(users, query.limit),
      },
    };
  }

  private static getNextCursor(users: User[], limit: number): string | null {
    const lastUser = users.at(-1);
    if (users.length === limit && lastUser) {
      return lastUser.id;
    }
    return null;
  }
}
