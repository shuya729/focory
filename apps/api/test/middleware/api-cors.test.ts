import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import apiCors from "../../src/middleware/api-cors";

const LOCAL_CORS_ORIGIN = "http://localhost:3000";
const PRODUCTION_CORS_ORIGIN = "https://www.focory.com";
const UNKNOWN_CORS_ORIGIN = "https://unknown.example.com";

const env = {
  CORS_ORIGINS: `${LOCAL_CORS_ORIGIN}, ${PRODUCTION_CORS_ORIGIN}`,
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
          Origin: LOCAL_CORS_ORIGIN,
        },
      },
      env
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      LOCAL_CORS_ORIGIN
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST"
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
      "Content-Type"
    );
    expect(response.headers.get("Access-Control-Max-Age")).toBe("86400");
  });

  it("カンマ区切りで指定された別 origin も許可する", async () => {
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
          Origin: PRODUCTION_CORS_ORIGIN,
        },
      },
      env
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      PRODUCTION_CORS_ORIGIN
    );
  });

  it("未許可の origin には許可 origin ヘッダーを返さない", async () => {
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
          Origin: UNKNOWN_CORS_ORIGIN,
        },
      },
      env
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
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
          Origin: LOCAL_CORS_ORIGIN,
        },
        body: JSON.stringify({ content: "問い合わせ内容", name: "山田 太郎" }),
      },
      env
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      LOCAL_CORS_ORIGIN
    );
    await expect(response.json()).resolves.toEqual({ data: { ok: true } });
  });
});
