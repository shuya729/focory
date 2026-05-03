import { afterEach, describe, expect, it, vi } from "vitest";
import type { DbClient } from "../../../src/lib/db/client";
import { MessagesService } from "../../../src/routes/messages/service";

const serviceOptions = {
  expoPushReceiptsUrl: "https://example.com/push/getReceipts",
  expoPushSendUrl: "https://example.com/push/send",
  gcpApiKey: "test-key",
  llmBaseUrl: "https://example.com/chat/completions",
  llmModel: "openai/gpt-oss-120b-maas",
};

describe("MessagesService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("finish メッセージを生成して保存する", async () => {
    const generateText = vi
      .fn()
      .mockResolvedValue(
        "「よく進みました。この流れをそのまま次の一手につなげましょう。」"
      );
    const sendToUser = vi.fn();
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
    const service = new MessagesService({} as DbClient, serviceOptions, {
      llmService: { generateText },
      pushNotificationService: { sendToUser },
      repository: { create },
    });

    const result = await service.createMessage("user-1", {
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "finish",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 1500,
    });

    expect(generateText).toHaveBeenCalledTimes(1);
    expect(generateText.mock.calls[0]?.[0]).toContain("type: finish");
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
    expect(sendToUser).not.toHaveBeenCalled();
    expect(result.data.message.type).toBe("finish");
  });

  it("stop メッセージなら保存後に push 通知を送る", async () => {
    const content = "少し区切れました。次は5分だけでも戻ってみましょう。";
    const generateText = vi.fn().mockResolvedValue(content);
    const sendToUser = vi.fn();
    const create = vi.fn().mockResolvedValue({
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "stop" as const,
      content,
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 900,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const service = new MessagesService({} as DbClient, serviceOptions, {
      llmService: { generateText },
      pushNotificationService: { sendToUser },
      repository: { create },
    });

    await service.createMessage("user-1", {
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "stop",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "実装",
      durationSec: 1500,
      elapsedSec: 900,
    });

    expect(sendToUser).toHaveBeenCalledWith("user-1", {
      title: "Focory",
      body: content,
    });
  });
});
