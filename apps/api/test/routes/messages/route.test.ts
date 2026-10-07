import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigurationError, TextGenerationError } from "../../../src/errors";
import { handleError } from "../../../src/middleware/handle-error";
import { MessagesRepository } from "../../../src/routes/messages/repository";
import messagesRoute from "../../../src/routes/messages/route";
import { postMessageResponseSchema } from "../../../src/routes/messages/schemas";
import { MessagesService } from "../../../src/routes/messages/service";
import { LlmService } from "../../../src/services/llm";

const env = {
  EXPO_PUSH_RECEIPTS_URL: "https://example.com/push/getReceipts",
  EXPO_PUSH_SEND_URL: "https://example.com/push/send",
  GCP_API_KEY: "test-key",
  GCP_LOCATION: "global",
  GCP_PROJECT_ID: "test-project",
  LLM_MODEL_ID: "gemini-2.5-flash-lite",
} as CloudflareBindings;

describe("POST /messages", () => {
  let app: Hono<{
    Variables: {
      ac: unknown;
      dc: unknown;
    };
  }>;
  let session: { user: { id: string } } | null;

  beforeEach(() => {
    session = {
      user: {
        id: "user-1",
      },
    };

    app = new Hono<{
      Variables: {
        ac: unknown;
        dc: unknown;
      };
    }>();
    app.use("*", async (c, next) => {
      c.set("ac", {
        api: {
          getSession: vi.fn(async () => session),
        },
      } as never);
      c.set("dc", {} as never);
      await next();
    });
    app.route("/messages", messagesRoute);
    app.onError(handleError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("不正な body なら 400 を返す", async () => {
    const createMessage = vi.spyOn(MessagesService.prototype, "createMessage");

    const response = await app.request(
      "/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
          type: "finish",
          behavior: "supporter",
          durationSec: 600,
          elapsedSec: 900,
        }),
      },
      env
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    });
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("妥当な body なら service の結果を返す", async () => {
    vi.spyOn(MessagesService.prototype, "createMessage").mockResolvedValue({
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
      type: "finish",
      content: "よく進みました。この流れをそのまま次の一手につなげましょう。",
      objective: "開発を進める",
      purpose: "デモ準備",
      behavior: "supporter",
      durationSec: 1500,
      elapsedSec: 1500,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await app.request(
      "/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
          type: "finish",
          objective: "開発を進める",
          purpose: "デモ準備",
          behavior: "supporter",
          durationSec: 1500,
          elapsedSec: 1500,
        }),
      },
      env
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(postMessageResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual({
      data: {
        message: {
          id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
          timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
          type: "finish",
          content:
            "よく進みました。この流れをそのまま次の一手につなげましょう。",
          objective: "開発を進める",
          purpose: "デモ準備",
          behavior: "supporter",
          durationSec: 1500,
          elapsedSec: 1500,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });
  });
  it("未認証なら共通ハンドラーが 401 を返す", async () => {
    session = null;
    const generateText = vi.spyOn(LlmService.prototype, "generateText");
    const response = await app.request("/messages", { method: "POST" }, env);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(generateText).not.toHaveBeenCalled();
  });

  it.each([
    [
      new TextGenerationError("Failed to generate text", {
        cause: new Error("private upstream details"),
      }),
      502,
      "Failed to generate text",
    ],
    [
      new ConfigurationError("LLM is not configured"),
      500,
      "LLM is not configured",
    ],
  ])("生成エラーを共通ハンドラーが HTTP %i へ変換する", async (error, status, message) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(LlmService.prototype, "generateText").mockRejectedValue(error);
    const create = vi.spyOn(MessagesRepository.prototype, "create");
    const response = await app.request(
      "/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
          type: "stop",
          behavior: "supporter",
          durationSec: 600,
          elapsedSec: 300,
        }),
      },
      env
    );
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error: message });
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, 500, "Failed to save message"],
    [new Error("private database details"), 500, "Internal server error"],
  ])("保存失敗を共通ハンドラーが 500 へ変換する", async (result, status, message) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(LlmService.prototype, "generateText").mockResolvedValue(
      "生成したメッセージ"
    );
    const create = vi.spyOn(MessagesRepository.prototype, "create");
    if (result instanceof Error) {
      create.mockRejectedValue(result);
    } else {
      create.mockResolvedValue(result);
    }
    const response = await app.request(
      "/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b902",
          type: "stop",
          behavior: "supporter",
          durationSec: 600,
          elapsedSec: 300,
        }),
      },
      env
    );
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error: message });
  });
});
