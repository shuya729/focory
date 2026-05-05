import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import contactsRoute from "../../../src/routes/contacts/route";
import { ContactsService } from "../../../src/routes/contacts/service";

describe("POST /contacts", () => {
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
    app.route("/contacts", contactsRoute);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("不正な body なら 400 を返す", async () => {
    const createContact = vi.spyOn(ContactsService.prototype, "createContact");

    const response = await app.request("/contacts", {
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
    expect(createContact).not.toHaveBeenCalled();
  });

  it("妥当な body なら service の結果を返す", async () => {
    vi.spyOn(ContactsService.prototype, "createContact").mockResolvedValue({
      data: {
        contact: {
          id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
          name: "山田 太郎",
          email: null,
          content: "問い合わせ内容です。",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      },
    });

    const response = await app.request("/contacts", {
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
    await expect(response.json()).resolves.toEqual({
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
});
