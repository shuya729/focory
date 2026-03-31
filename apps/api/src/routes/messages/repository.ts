import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import { messages } from "../../lib/db/schema";
import type { MessageResponse, MessageType } from "./schemas";

export interface CreateMessageValue {
  userId: string;
  timerId: string;
  type: MessageType;
  content: string;
  objective: string | null;
  purpose: string | null;
  behavior: string | null;
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
          content: value.content,
          objective: value.objective,
          purpose: value.purpose,
          behavior: value.behavior,
          durationSec: value.durationSec,
          elapsedSec: value.elapsedSec,
        })
        .returning({
          id: messages.id,
          timerId: messages.timerId,
          type: messages.type,
          content: messages.content,
          objective: messages.objective,
          purpose: messages.purpose,
          behavior: messages.behavior,
          durationSec: messages.durationSec,
          elapsedSec: messages.elapsedSec,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
        });

      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }
}
