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
      behavior: "supporter" as const,
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
  it("DB に不正な behavior が保存されている場合は返却を拒否する", async () => {
    const repository = new MessagesRepository({
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ behavior: "unknown" }]),
        }),
      }),
    } as unknown as DbClient);
    await expect(
      repository.create({
        userId: "user-1",
        timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
        type: "start",
        behavior: "supporter",
        content: "メッセージ",
        objective: null,
        purpose: null,
        durationSec: 600,
        elapsedSec: 0,
      })
    ).rejects.toThrow("Stored message contains an invalid behavior");
  });
});
