import { describe, expect, it } from "vitest";
import { postMessageJsonSchema } from "../../../src/routes/messages/schemas";

describe("postMessageJsonSchema", () => {
  it("elapsedSec が durationSec 以下なら受け入れる", () => {
    const result = postMessageJsonSchema.safeParse({
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      type: "finish",
      behavior: "supporter",
      objective: "開発を進める",
      purpose: "デモ準備",
      durationSec: 1500,
      elapsedSec: 1200,
    });

    expect(result.success).toBe(true);
  });

  it("elapsedSec が durationSec を超えると拒否する", () => {
    const result = postMessageJsonSchema.safeParse({
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      type: "finish",
      behavior: "supporter",
      objective: null,
      purpose: null,
      durationSec: 600,
      elapsedSec: 900,
    });

    expect(result.success).toBe(false);
  });

  it("不正な behavior は拒否する", () => {
    const result = postMessageJsonSchema.safeParse({
      timerId: "018f7c31-0f58-7dc7-a7fb-70f802b6b901",
      type: "finish",
      behavior: "unknown",
      durationSec: 600,
      elapsedSec: 300,
    });

    expect(result.success).toBe(false);
  });
});
