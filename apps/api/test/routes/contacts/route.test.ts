import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleError } from "../../../src/middleware/handle-error";
import { ContactsRepository } from "../../../src/routes/contacts/repository";
import contactsRoute from "../../../src/routes/contacts/route";
import { postContactResponseSchema } from "../../../src/routes/contacts/schemas";
import { ContactsService } from "../../../src/routes/contacts/service";

describe("POST /v1/contacts", () => {
  let app: Hono<{
    Variables: {
      dc: unknown;
    };
  }>;

  beforeEach(() => {
    app = new Hono<{
      Variables: {
        dc: unknown;
      };
    }>();
    app.use("*", async (c, next) => {
      c.set("dc", {} as never);
      await next();
    });
    app.basePath("/v1").route("/contacts", contactsRoute);
    app.onError(handleError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("不正な body なら 400 を返す", async () => {
    const createContact = vi.spyOn(ContactsService.prototype, "createContact");

    const response = await app.request("/v1/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "山田 太郎",
        email: "invalid-email",
        content: "問い合わせ内容です。",
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    });
    expect(createContact).not.toHaveBeenCalled();
  });

  it("妥当な body なら service の結果を返す", async () => {
    vi.spyOn(ContactsService.prototype, "createContact").mockResolvedValue({
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      name: "山田 太郎",
      email: null,
      content: "問い合わせ内容です。",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await app.request("/v1/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "山田 太郎",
        email: null,
        content: "問い合わせ内容です。",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(postContactResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual({
      data: {
        contact: {
          id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
          name: "山田 太郎",
          email: null,
          content: "問い合わせ内容です。",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });
  });
  it.each([
    ["保存結果がない", undefined, "Failed to save contact"],
    [
      "DB が失敗する",
      new Error("private database details"),
      "Internal server error",
    ],
  ])("%s場合は共通ハンドラーが 500 を返す", async (_, result, message) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const create = vi.spyOn(ContactsRepository.prototype, "create");
    if (result instanceof Error) {
      create.mockRejectedValue(result);
    } else {
      create.mockResolvedValue(result);
    }
    const response = await app.request("/v1/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "山田",
        email: null,
        content: "問い合わせ",
      }),
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: message });
  });
});
