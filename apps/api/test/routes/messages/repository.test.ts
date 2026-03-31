import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "../../../src/lib/db/client";
import { messages } from "../../../src/lib/db/schema";
import { MessagesRepository } from "../../../src/routes/messages/repository";

describe("MessagesRepository", () => {
  it("message を作成して返す", async () => {
    const storedMessage = {
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "stop" as const,
      content: "少し休んで、次の一歩だけ進めましょう。",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 900,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const returning = vi.fn().mockResolvedValue([storedMessage]);
    const values = vi.fn().mockReturnValue({
      returning,
    });
    const insert = vi.fn().mockReturnValue({
      values,
    });
    const repository = new MessagesRepository({
      insert,
    } as unknown as DbClient);

    const result = await repository.create({
      userId: "user-1",
      timerId: storedMessage.timerId,
      type: storedMessage.type,
      content: storedMessage.content,
      objective: storedMessage.objective,
      purpose: storedMessage.purpose,
      behavior: storedMessage.behavior,
      durationSec: storedMessage.durationSec,
      elapsedSec: storedMessage.elapsedSec,
    });

    expect(insert).toHaveBeenCalledWith(messages);
    expect(values).toHaveBeenCalledWith({
      userId: "user-1",
      timerId: storedMessage.timerId,
      type: storedMessage.type,
      content: storedMessage.content,
      objective: storedMessage.objective,
      purpose: storedMessage.purpose,
      behavior: storedMessage.behavior,
      durationSec: storedMessage.durationSec,
      elapsedSec: storedMessage.elapsedSec,
    });
    expect(result).toEqual(storedMessage);
  });
});
