import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactsRepository } from "../../src/routes/contacts/repository";
import app from "../../src/routes/route";

vi.mock("../../src/lib/db/client", () => ({ getDb: vi.fn(() => ({})) }));
vi.mock("../../src/lib/redis/client", () => ({ getRedis: vi.fn(() => ({})) }));
vi.mock("../../src/lib/auth/client", () => ({
  getAuth: vi.fn(() => ({ handler: () => new Response("auth response") })),
}));

describe("API アプリの組み立て", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("認証ルートを認証クライアントへ渡す", async () => {
    const response = await app.request(
      "/auth/session",
      {},
      { CORS_ORIGIN: "https://example.com" }
    );
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("auth response");
  });

  it("実際のアプリに共通エラーハンドラーが登録されている", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(ContactsRepository.prototype, "create").mockRejectedValue(
      new Error("private database details")
    );
    const response = await app.request(
      "/contacts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "山田",
          email: null,
          content: "問い合わせ",
        }),
      },
      { CORS_ORIGIN: "https://example.com" }
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });
});
