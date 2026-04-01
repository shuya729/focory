import { afterEach, describe, expect, it, vi } from "vitest";
import type { DbClient } from "../../../src/lib/db/client";
import { MessagesService } from "../../../src/routes/messages/service";

const createJsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });

const stubFetch = (...responses: Response[]) => {
  const fetchMock = vi.fn();

  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("MessagesService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("finish メッセージを生成して保存する", async () => {
    const fetchMock = stubFetch(
      createJsonResponse({
        choices: [
          {
            message: {
              content:
                "よく進みました。この流れをそのまま次の一手につなげましょう。",
            },
          },
        ],
      })
    );
    const create = vi.fn().mockResolvedValue({
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "finish" as const,
      content: "よく進みました。この流れをそのまま次の一手につなげましょう。",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 1500,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const findByUserId = vi.fn().mockResolvedValue([]);
    const deleteByToken = vi.fn();
    const service = new MessagesService({} as DbClient, {
      expoPushReceiptsUrl: "https://example.com/push/getReceipts",
      expoPushSendUrl: "https://example.com/push/send",
      gcpApiKey: "test-key",
      llmBaseUrl: "https://example.com/chat/completions",
      llmModel: "openai/gpt-oss-120b-maas",
    });

    service.repository = {
      create,
    } as never;
    service.pushTokensRepository = {
      findByUserId,
      deleteByToken,
    } as never;

    const result = await service.createMessage("user-1", {
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "finish",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 1500,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      userId: "user-1",
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "finish",
      content: "よく進みました。この流れをそのまま次の一手につなげましょう。",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 1500,
    });
    expect(findByUserId).not.toHaveBeenCalled();
    expect(deleteByToken).not.toHaveBeenCalled();
    expect(result.data.message.type).toBe("finish");
  });

  it("stop 通知で DeviceNotRegistered なら token を削除する", async () => {
    const token = "ExponentPushToken[dead-token]";
    const fetchMock = stubFetch(
      createJsonResponse({
        choices: [
          {
            message: {
              content: "少し区切れました。次は 5 分だけでも戻ってみましょう。",
            },
          },
        ],
      }),
      createJsonResponse({
        data: {
          status: "error",
          message: "not registered",
          details: {
            error: "DeviceNotRegistered",
          },
        },
      })
    );
    const create = vi.fn().mockResolvedValue({
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "stop" as const,
      content: "少し区切れました。次は 5 分だけでも戻ってみましょう。",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 900,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const findByUserId = vi.fn().mockResolvedValue([
      {
        token,
        userId: "user-1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    const deleteByToken = vi.fn().mockResolvedValue(undefined);
    const service = new MessagesService({} as DbClient, {
      expoPushReceiptsUrl: "https://example.com/push/getReceipts",
      expoPushSendUrl: "https://example.com/push/send",
      gcpApiKey: "test-key",
      llmBaseUrl: "https://example.com/chat/completions",
      llmModel: "openai/gpt-oss-120b-maas",
    });

    service.repository = {
      create,
    } as never;
    service.pushTokensRepository = {
      findByUserId,
      deleteByToken,
    } as never;

    await service.createMessage("user-1", {
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "stop",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 900,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(findByUserId).toHaveBeenCalledWith("user-1");
    expect(deleteByToken).toHaveBeenCalledWith(token);
  });
});
