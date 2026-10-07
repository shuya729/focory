import { SaveFailedError } from "../../errors";
import type {
  PushTokensRepositoryInterface,
  SavePushTokenInput,
  StoredPushToken,
} from "./types";

export class PushTokensService {
  private readonly repository: Pick<PushTokensRepositoryInterface, "upsert">;

  constructor(repository: Pick<PushTokensRepositoryInterface, "upsert">) {
    this.repository = repository;
  }

  async savePushToken(
    userId: string,
    input: SavePushTokenInput
  ): Promise<StoredPushToken> {
    const pushToken = await this.repository.upsert(userId, input.token);
    if (!pushToken) {
      throw new SaveFailedError("Failed to save push token");
    }
    return pushToken;
  }
}
