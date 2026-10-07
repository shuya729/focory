import { describe, expect, it, vi } from "vitest";
import { SaveFailedError } from "../../../src/errors";
import { ContactsService } from "../../../src/routes/contacts/service";

describe("ContactsService", () => {
  it("repository で作成した contact を返す", async () => {
    const storedContact = {
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      name: "山田 太郎",
      email: null,
      content: "問い合わせ内容です。",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const create = vi.fn().mockResolvedValue(storedContact);
    const service = new ContactsService({ create });

    const result = await service.createContact({
      name: storedContact.name,
      email: storedContact.email,
      content: storedContact.content,
    });

    expect(create).toHaveBeenCalledWith({
      name: storedContact.name,
      email: storedContact.email,
      content: storedContact.content,
    });
    expect(result).toEqual(storedContact);
  });
  it("保存結果がない場合は保存失敗を返す", async () => {
    const service = new ContactsService({
      create: vi.fn().mockResolvedValue(undefined),
    });
    await expect(
      service.createContact({
        name: "山田",
        email: null,
        content: "問い合わせ",
      })
    ).rejects.toBeInstanceOf(SaveFailedError);
  });

  it("DB の失敗を呼び出し元へ伝播させる", async () => {
    const cause = new Error("Database unavailable");
    const service = new ContactsService({
      create: vi.fn().mockRejectedValue(cause),
    });
    await expect(
      service.createContact({
        name: "山田",
        email: null,
        content: "問い合わせ",
      })
    ).rejects.toBe(cause);
  });
});
