import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "../../../src/lib/db/client";
import { contacts } from "../../../src/lib/db/schema";
import { ContactsRepository } from "../../../src/routes/contacts/repository";

describe("ContactsRepository", () => {
  it("contact を作成して返す", async () => {
    const storedContact = {
      id: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      name: "山田 太郎",
      email: "taro@example.com",
      content: "問い合わせ内容です。",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const returning = vi.fn().mockResolvedValue([storedContact]);
    const values = vi.fn().mockReturnValue({
      returning,
    });
    const insert = vi.fn().mockReturnValue({
      values,
    });
    const repository = new ContactsRepository({
      insert,
    } as unknown as DbClient);

    const result = await repository.create({
      name: storedContact.name,
      email: storedContact.email,
      content: storedContact.content,
    });

    expect(insert).toHaveBeenCalledWith(contacts);
    expect(values).toHaveBeenCalledWith({
      name: storedContact.name,
      email: storedContact.email,
      content: storedContact.content,
    });
    expect(result).toEqual(storedContact);
  });
});
