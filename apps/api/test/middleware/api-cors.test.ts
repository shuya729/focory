import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import apiCors from "../../src/middleware/api-cors";

const CORS_ORIGIN = "http://localhost:3000";

const env = {
  CORS_ORIGIN,
} as CloudflareBindings;

describe("apiCors", () => {
  it("preflight リクエストに CORS ヘッダーを返す", async () => {
    const app = new Hono<{ Bindings: CloudflareBindings }>();
    app.use("*", apiCors);
    app.post("/contacts", (c) => c.json({ data: { ok: true } }));

    const response = await app.request(
      "/contacts",
      {
        method: "OPTIONS",
        headers: {
          "Access-Control-Request-Headers": "Content-Type",
          "Access-Control-Request-Method": "POST",
          Origin: CORS_ORIGIN,
        },
      },
      env
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      CORS_ORIGIN
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST"
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
      "Content-Type"
    );
    expect(response.headers.get("Access-Control-Max-Age")).toBe("86400");
  });

  it("通常リクエストを後続ルートへ通す", async () => {
    const app = new Hono<{ Bindings: CloudflareBindings }>();
    app.use("*", apiCors);
    app.post("/contacts", (c) => c.json({ data: { ok: true } }));

    const response = await app.request(
      "/contacts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: CORS_ORIGIN,
        },
        body: JSON.stringify({ content: "問い合わせ内容", name: "山田 太郎" }),
      },
      env
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      CORS_ORIGIN
    );
    await expect(response.json()).resolves.toEqual({ data: { ok: true } });
  });
});
