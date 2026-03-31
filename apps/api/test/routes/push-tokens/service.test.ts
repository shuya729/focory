import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "../../../src/lib/db/client";
import { PushTokensService } from "../../../src/routes/push-tokens/service";

describe("PushTokensService", () => {
  it("upsert した token を返す", async () => {
    const service = new PushTokensService({} as DbClient);
    const upsert = vi.fn().mockResolvedValue({
      token: "ExponentPushToken[abc123]",
      userId: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    service.repository = {
      upsert,
    } as never;

    const result = await service.savePushToken("user-1", {
      token: "ExponentPushToken[abc123]",
    });

    expect(upsert).toHaveBeenCalledWith("user-1", "ExponentPushToken[abc123]");
    expect(result).toEqual({
      data: {
        pushToken: {
          token: "ExponentPushToken[abc123]",
        },
      },
    });
  });
});
