import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import { messages } from "../../lib/db/schema";
import type { BehaviorValue } from "./prompots";
import type { MessageResponse, MessageType } from "./schemas";

export interface CreateMessageValue {
  userId: string;
  timerId: string;
  type: MessageType;
  behavior: BehaviorValue;
  content: string;
  objective: string | null;
  purpose: string | null;
  durationSec: number;
  elapsedSec: number;
}

export interface MessagesRepositoryInterface {
  create(value: CreateMessageValue): Promise<MessageResponse | undefined>;
}

export class MessagesRepository implements MessagesRepositoryInterface {
  db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async create(
    value: CreateMessageValue
  ): Promise<MessageResponse | undefined> {
    try {
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

      return row as MessageResponse;
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }
}
