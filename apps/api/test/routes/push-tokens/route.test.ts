import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleError } from "../../../src/middleware/handle-error";
import { PushTokensRepository } from "../../../src/routes/push-tokens/repository";
import pushTokensRoute from "../../../src/routes/push-tokens/route";
import { postPushTokenResponseSchema } from "../../../src/routes/push-tokens/schemas";
import { PushTokensService } from "../../../src/routes/push-tokens/service";

describe("POST /push-tokens", () => {
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
    app.route("/push-tokens", pushTokensRoute);
    app.onError(handleError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("未認証なら 401 を返す", async () => {
    session = null;
    const savePushToken = vi.spyOn(
      PushTokensService.prototype,
      "savePushToken"
    );

    const response = await app.request("/push-tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: "ExponentPushToken[abc123]",
      }),
    });

    expect(response.status).toBe(401);
    expect(savePushToken).not.toHaveBeenCalled();
  });

  it("妥当な body なら service の結果を返す", async () => {
    vi.spyOn(PushTokensService.prototype, "savePushToken").mockResolvedValue({
      token: "ExponentPushToken[abc123]",
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await app.request("/push-tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: "ExponentPushToken[abc123]",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(postPushTokenResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual({
      data: {
        pushToken: {
          token: "ExponentPushToken[abc123]",
        },
      },
    });
  });
  it("保存結果がない場合は共通ハンドラーが 500 を返す", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(PushTokensRepository.prototype, "upsert").mockResolvedValue(
      undefined
    );
    const response = await app.request("/push-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "ExponentPushToken[abc123]" }),
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to save push token",
    });
  });
  it("不正な token なら共通ハンドラーが 400 を返す", async () => {
    const savePushToken = vi.spyOn(
      PushTokensService.prototype,
      "savePushToken"
    );
    const response = await app.request("/push-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-token" }),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    });
    expect(savePushToken).not.toHaveBeenCalled();
  });
});
