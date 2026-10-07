import { Hono } from "hono";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import z from "zod";
import { ValidationError } from "../../src/errors";
import { handleError } from "../../src/middleware/handle-error";
import { validateRequest } from "../../src/middleware/validate-request";

describe("validateRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("検証失敗は ValidationError を経由して 400 を返し、入力値を公開しない", async () => {
    const onError = vi.fn(handleError);
    const logError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const handler = vi.fn((c) => c.json({ ok: true }));
    const app = new Hono();
    app.onError(onError);
    app.post(
      "/",
      validateRequest("json", z.object({ email: z.email() })),
      handler
    );

    const response = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "private-invalid-input" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    });
    expect(onError).toHaveBeenCalledWith(
      expect.any(ValidationError),
      expect.anything()
    );
    expect(handler).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it("正常な JSON を変換し、変換後の型をハンドラーへ渡す", async () => {
    const app = new Hono();
    app.onError(handleError);
    app.post(
      "/",
      validateRequest(
        "json",
        z.object({ name: z.string().trim(), age: z.string().transform(Number) })
      ),
      (c) => {
        const input = c.req.valid("json");
        expectTypeOf(input).toEqualTypeOf<{ name: string; age: number }>();
        return c.json(input);
      }
    );

    const response = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "  山田  ", age: "30" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ name: "山田", age: 30 });
  });

  it("query と param をそれぞれの型で検証する", async () => {
    const app = new Hono();
    app.onError(handleError);
    app.get(
      "/:id",
      validateRequest("param", z.object({ id: z.uuid() })),
      validateRequest(
        "query",
        z.object({ limit: z.string().transform(Number) })
      ),
      (c) => {
        const param = c.req.valid("param");
        const query = c.req.valid("query");
        expectTypeOf(param).toEqualTypeOf<{ id: string }>();
        expectTypeOf(query).toEqualTypeOf<{ limit: number }>();
        return c.json({ ...param, ...query });
      }
    );
    const id = "018f7c31-0f58-7dc7-a7fb-70f802b6b901";

    const response = await app.request(`/${id}?limit=10`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id, limit: 10 });

    const invalidParam = await app.request("/invalid-id?limit=10");
    expect(invalidParam.status).toBe(400);
    await expect(invalidParam.json()).resolves.toEqual({
      error: "Invalid request",
    });

    const invalidQuery = await app.request(`/${id}`);
    expect(invalidQuery.status).toBe(400);
    await expect(invalidQuery.json()).resolves.toEqual({
      error: "Invalid request",
    });
  });

  it("壊れた JSON は Hono の HTTPException として引き続き 400 を返す", async () => {
    const app = new Hono();
    app.onError(handleError);
    app.post(
      "/",
      validateRequest("json", z.object({ name: z.string() })),
      (c) => c.json(c.req.valid("json"))
    );

    const response = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Malformed JSON in request body",
    });
  });
});
