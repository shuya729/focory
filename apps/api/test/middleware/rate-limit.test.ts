import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RedisClient } from "../../src/lib/redis/client";
import { handleError } from "../../src/middleware/handle-error";
import {
  createRateLimit,
  type RateLimitVariables,
} from "../../src/middleware/rate-limit";

const WINDOW_MS = 5 * 60 * 60 * 1000;
const NOW_MS = WINDOW_MS * 100 + WINDOW_MS / 2;

describe("createRateLimit", () => {
  let app: Hono<{ Variables: RateLimitVariables }>;
  const evalScript = vi.fn();
  const handler = vi.fn(() => new Response("allowed"));

  beforeEach(() => {
    evalScript.mockReset().mockResolvedValue([99, 100]);
    handler.mockClear();
    vi.spyOn(Date, "now").mockReturnValue(NOW_MS);
    const redis = { evalsha: evalScript } as unknown as RedisClient;
    app = new Hono<{ Variables: RateLimitVariables }>();
    app.onError(handleError);
    app.use(async (c, next) => {
      c.set("rc", redis);
      c.set("userId", c.req.header("X-Test-User") ?? "user-1");
      await next();
    });
    app.post(
      "/",
      createRateLimit({
        limit: 100,
        window: "5 h",
        prefix: "focory:ratelimit:messages",
      }),
      handler
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("100回 / 5時間の設定とユーザー別キーを Redis へ渡す", async () => {
    const response = await app.request("/", { method: "POST" });
    expect(response.status).toBe(200);
    expect(evalScript).toHaveBeenCalledWith(
      expect.any(String),
      [
        "focory:ratelimit:messages:user-1:100",
        "focory:ratelimit:messages:user-1:99",
        "",
      ],
      [100, NOW_MS, WINDOW_MS, 1]
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("別ユーザーの判定には別の Redis キーを使う", async () => {
    const response = await app.request("/", {
      method: "POST",
      headers: { "X-Test-User": "user-2" },
    });
    expect(response.status).toBe(200);
    expect(evalScript).toHaveBeenCalledWith(
      expect.any(String),
      [
        "focory:ratelimit:messages:user-2:100",
        "focory:ratelimit:messages:user-2:99",
        "",
      ],
      [100, NOW_MS, WINDOW_MS, 1]
    );
  });

  it.each([
    { remaining: 0, status: 200 },
    { remaining: -1, status: 429 },
  ])("Redis の残数 $remaining に従って $status を返す", async ({
    remaining,
    status,
  }) => {
    evalScript.mockResolvedValue([remaining, 100]);
    const response = await app.request("/", { method: "POST" });
    expect(response.status).toBe(status);
    expect(handler).toHaveBeenCalledTimes(status === 200 ? 1 : 0);
    if (status === 429) {
      await expect(response.json()).resolves.toEqual({
        error: "Too many requests",
      });
    }
  });

  it("Redis の判定が既定の5秒以内に終わらない場合は自動許可を500へ変換する", async () => {
    const logError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.useFakeTimers();
    evalScript.mockImplementation(() => new Promise(() => undefined));
    const responsePromise = app.request("/", { method: "POST" });
    await vi.advanceTimersByTimeAsync(4999);
    expect(logError).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    const response = await responsePromise;
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
    expect(handler).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Rate limit check timed out" })
    );
  });

  it("Redis の障害時は500を返して内部の原因を公開しない", async () => {
    const logError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const cause = new Error("private Redis details");
    evalScript.mockRejectedValue(cause);
    const response = await app.request("/", { method: "POST" });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
    expect(handler).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(cause);
  });
});
