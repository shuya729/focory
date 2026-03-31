import { describe, expect, it } from "vitest";
import { postPushTokenJsonSchema } from "../../../src/routes/push-tokens/schemas";

describe("postPushTokenJsonSchema", () => {
  it("Expo push token を受け入れる", () => {
    const result = postPushTokenJsonSchema.safeParse({
      token: "ExponentPushToken[abc123]",
    });

    expect(result.success).toBe(true);
  });

  it("不正な token を拒否する", () => {
    const result = postPushTokenJsonSchema.safeParse({
      token: "invalid-token",
    });

    expect(result.success).toBe(false);
  });
});
