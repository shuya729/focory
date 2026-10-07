import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConfigurationError,
  SaveFailedError,
  TextGenerationError,
} from "../../../src/errors";
import { MessagesService } from "../../../src/routes/messages/service";

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
      behavior: "supporter" as const,
      content: "よく進みました。この流れをそのまま次の一手につなげましょう。",
      objective: "開発を進める",
      purpose: "デモ準備",
      durationSec: 1500,
      elapsedSec: 1500,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const service = new MessagesService({
      llmService: { generateText },
      pushNotificationService: { sendToUser },
      repository: { create },
    });

    const result = await service.createMessage("user-1", {
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "finish",
      behavior: "supporter",
      objective: "開発を進める",
      purpose: "デモ準備",
      durationSec: 1500,
      elapsedSec: 1500,
    });

    expect(generateText).toHaveBeenCalledTimes(1);
    const prompt = generateText.mock.calls[0]?.[0] as string;
    expect(prompt).toContain("# 役割");
    expect(prompt).toContain("# キャラクター");
    expect(prompt).toContain("# 今回の入力");
    expect(prompt).toContain("objective: 開発を進める");
    expect(prompt).toContain("purpose: デモ準備");
    expect(create).toHaveBeenCalledWith({
      userId: "user-1",
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "finish",
      behavior: "supporter",
      content: "よく進みました。この流れをそのまま次の一手につなげましょう。",
      objective: "開発を進める",
      purpose: "デモ準備",
      durationSec: 1500,
      elapsedSec: 1500,
    });
    expect(sendToUser).not.toHaveBeenCalled();
    expect(result.type).toBe("finish");
  });

  it("stop メッセージなら保存後に push 通知を送る", async () => {
    const content = "少し区切れました。次は5分だけでも戻ってみましょう。";
    const generateText = vi.fn().mockResolvedValue(content);
    const sendToUser = vi.fn();
    const create = vi.fn().mockResolvedValue({
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "stop" as const,
      behavior: "rival" as const,
      content,
      objective: "開発を進める",
      purpose: "デモ準備",
      durationSec: 1500,
      elapsedSec: 900,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const service = new MessagesService({
      llmService: { generateText },
      pushNotificationService: { sendToUser },
      repository: { create },
    });

    await service.createMessage("user-1", {
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "stop",
      behavior: "rival",
      objective: "開発を進める",
      purpose: "デモ準備",
      durationSec: 1500,
      elapsedSec: 900,
    });

    expect(sendToUser).toHaveBeenCalledWith("user-1", {
      title: "Focory",
      body: content,
    });
  });
  it.each([
    "start",
    "restart",
    "finish",
  ] as const)("%s では通知を送らない", async (type) => {
    const create = vi
      .fn()
      .mockResolvedValue({ content: "生成したメッセージ", type });
    const sendToUser = vi.fn();
    const service = new MessagesService({
      repository: { create },
      llmService: {
        generateText: vi.fn().mockResolvedValue("生成したメッセージ"),
      },
      pushNotificationService: { sendToUser },
    });
    await service.createMessage("user-1", {
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type,
      behavior: "supporter",
      durationSec: 600,
      elapsedSec: 300,
    });
    expect(sendToUser).not.toHaveBeenCalled();
  });

  it("空の生成結果なら保存も通知もしない", async () => {
    const create = vi.fn();
    const sendToUser = vi.fn();
    const service = new MessagesService({
      repository: { create },
      llmService: { generateText: vi.fn().mockResolvedValue("「 」") },
      pushNotificationService: { sendToUser },
    });
    await expect(
      service.createMessage("user-1", {
        timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
        type: "stop",
        behavior: "supporter",
        durationSec: 600,
        elapsedSec: 300,
      })
    ).rejects.toBeInstanceOf(TextGenerationError);
    expect(create).not.toHaveBeenCalled();
    expect(sendToUser).not.toHaveBeenCalled();
  });

  it("保存結果がない場合は通知を送らない", async () => {
    const sendToUser = vi.fn();
    const service = new MessagesService({
      repository: { create: vi.fn().mockResolvedValue(undefined) },
      llmService: {
        generateText: vi.fn().mockResolvedValue("生成したメッセージ"),
      },
      pushNotificationService: { sendToUser },
    });
    await expect(
      service.createMessage("user-1", {
        timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
        type: "stop",
        behavior: "supporter",
        durationSec: 600,
        elapsedSec: 300,
      })
    ).rejects.toBeInstanceOf(SaveFailedError);
    expect(sendToUser).not.toHaveBeenCalled();
  });

  it("任意の入力文を正規化して保存する", async () => {
    const create = vi.fn().mockResolvedValue({ content: "生成したメッセージ" });
    const service = new MessagesService({
      repository: { create },
      llmService: {
        generateText: vi.fn().mockResolvedValue("生成したメッセージ"),
      },
      pushNotificationService: { sendToUser: vi.fn() },
    });
    await service.createMessage("user-1", {
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "start",
      behavior: "supporter",
      durationSec: 600,
      elapsedSec: 0,
      objective: "  開発  ",
      purpose: "   ",
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ objective: "開発", purpose: null })
    );
  });

  it("通知設定不足は保存後でも呼び出し元へ伝播させる", async () => {
    const cause = new ConfigurationError(
      "Expo push notification is not configured"
    );
    const create = vi.fn().mockResolvedValue({ content: "生成したメッセージ" });
    const service = new MessagesService({
      repository: { create },
      llmService: {
        generateText: vi.fn().mockResolvedValue("生成したメッセージ"),
      },
      pushNotificationService: { sendToUser: vi.fn().mockRejectedValue(cause) },
    });
    await expect(
      service.createMessage("user-1", {
        timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
        type: "stop",
        behavior: "supporter",
        durationSec: 600,
        elapsedSec: 300,
      })
    ).rejects.toBe(cause);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
