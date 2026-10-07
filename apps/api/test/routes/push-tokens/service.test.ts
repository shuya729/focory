import { describe, expect, it, vi } from "vitest";
import { SaveFailedError } from "../../../src/errors";
import { PushTokensService } from "../../../src/routes/push-tokens/service";

describe("PushTokensService", () => {
  it("upsert した token を返す", async () => {
    const upsert = vi.fn().mockResolvedValue({
      token: "ExponentPushToken[abc123]",
      userId: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const service = new PushTokensService({ upsert });

    const result = await service.savePushToken("user-1", {
      token: "ExponentPushToken[abc123]",
    });

    expect(upsert).toHaveBeenCalledWith("user-1", "ExponentPushToken[abc123]");
    expect(result).toMatchObject({
      token: "ExponentPushToken[abc123]",
      userId: "user-1",
    });
  });
  it("保存結果がない場合は保存失敗を返す", async () => {
    const service = new PushTokensService({
      upsert: vi.fn().mockResolvedValue(undefined),
    });
    await expect(
      service.savePushToken("user-1", { token: "ExponentPushToken[abc123]" })
    ).rejects.toBeInstanceOf(SaveFailedError);
  });

  it("DB の失敗を呼び出し元へ伝播させる", async () => {
    const cause = new Error("Database unavailable");
    const service = new PushTokensService({
      upsert: vi.fn().mockRejectedValue(cause),
    });
    await expect(
      service.savePushToken("user-1", { token: "ExponentPushToken[abc123]" })
    ).rejects.toBe(cause);
  });
});
