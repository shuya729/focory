import { describe, expect, it } from "vitest";
import { postContactJsonSchema } from "../../../src/routes/contacts/schemas";

describe("postContactJsonSchema", () => {
  it("name、nullable email、content を受け入れる", () => {
    const result = postContactJsonSchema.safeParse({
      name: "山田 太郎",
      email: null,
      content: "問い合わせ内容です。",
    });

    expect(result.success).toBe(true);
  });

  it("email が文字列なら前後空白を除去して検証する", () => {
    const result = postContactJsonSchema.safeParse({
      name: "山田 太郎",
      email: " taro@example.com ",
      content: "問い合わせ内容です。",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "山田 太郎",
        email: "taro@example.com",
        content: "問い合わせ内容です。",
      },
    });
  });

  it("空の name を拒否する", () => {
    const result = postContactJsonSchema.safeParse({
      name: " ",
      email: null,
      content: "問い合わせ内容です。",
    });

    expect(result.success).toBe(false);
  });

  it("不正な email を拒否する", () => {
    const result = postContactJsonSchema.safeParse({
      name: "山田 太郎",
      email: "invalid-email",
      content: "問い合わせ内容です。",
    });

    expect(result.success).toBe(false);
  });
});
