import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messagesRoute from "../../../src/routes/messages/route";
import { MessagesService } from "../../../src/routes/messages/service";

const env = {
  EXPO_PUSH_RECEIPTS_URL: "https://example.com/push/getReceipts",
  EXPO_PUSH_SEND_URL: "https://example.com/push/send",
  GCP_API_KEY: "test-key",
  LLM_BASE_URL: "https://example.com/chat/completions",
  LLM_MODEL: "openai/gpt-oss-120b-maas",
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
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("妥当な body なら service の結果を返す", async () => {
    vi.spyOn(MessagesService.prototype, "createMessage").mockResolvedValue({
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
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      },
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
    await expect(response.json()).resolves.toEqual({
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
});
