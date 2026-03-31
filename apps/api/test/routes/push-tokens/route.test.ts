import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pushTokensRoute from "../../../src/routes/push-tokens/route";
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
      data: {
        pushToken: {
          token: "ExponentPushToken[abc123]",
        },
      },
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
    await expect(response.json()).resolves.toEqual({
      data: {
        pushToken: {
          token: "ExponentPushToken[abc123]",
        },
      },
    });
  });
});
