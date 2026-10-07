import type { DbClient } from "../../lib/db/client";
import { messages } from "../../lib/db/schema";
import { BEHAVIOR_VALUES } from "./constants";
import type {
  CreateMessageValue,
  MessagesRepositoryInterface,
  StoredMessage,
} from "./types";

export class MessagesRepository implements MessagesRepositoryInterface {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async create(value: CreateMessageValue): Promise<StoredMessage | undefined> {
    const rows = await this.db
      .insert(messages)
      .values({
        userId: value.userId,
        timerId: value.timerId,
        type: value.type,
        behavior: value.behavior,
        content: value.content,
        objective: value.objective,
        purpose: value.purpose,
        durationSec: value.durationSec,
        elapsedSec: value.elapsedSec,
      })
      .returning({
        id: messages.id,
        timerId: messages.timerId,
        type: messages.type,
        behavior: messages.behavior,
        content: messages.content,
        objective: messages.objective,
        purpose: messages.purpose,
        durationSec: messages.durationSec,
        elapsedSec: messages.elapsedSec,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
      });

    const row = rows[0];

    if (!row) {
      return;
    }

    const behavior = BEHAVIOR_VALUES.find((value) => value === row.behavior);
    if (!behavior) {
      throw new Error("Stored message contains an invalid behavior");
    }
    return { ...row, behavior };
  }
}
