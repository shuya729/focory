import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import { PushTokensRepository } from "./repository";
import type { PostPushTokenJsonSchema, PostPushTokenResponse } from "./schemas";

export class PushTokensService {
  repository: PushTokensRepository;

  constructor(db: DbClient) {
    this.repository = new PushTokensRepository(db);
  }

  async savePushToken(
    userId: string,
    json: PostPushTokenJsonSchema
  ): Promise<PostPushTokenResponse> {
    const pushToken = await this.repository.upsert(userId, json.token);

    if (!pushToken) {
      throw new HTTPException(500, { message: "Failed to save push token" });
    }

    return {
      data: {
        pushToken: {
          token: pushToken.token,
        },
      },
    };
  }
}
