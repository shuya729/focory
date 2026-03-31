import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "../../../src/lib/db/client";
import { pushTokens } from "../../../src/lib/db/schema";
import { PushTokensRepository } from "../../../src/routes/push-tokens/repository";

describe("PushTokensRepository", () => {
  it("token の upsert を実行する", async () => {
    const storedPushToken = {
      token: "ExponentPushToken[abc123]",
      userId: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const returning = vi.fn().mockResolvedValue([storedPushToken]);
    const onConflictDoUpdate = vi.fn().mockReturnValue({
      returning,
    });
    const values = vi.fn().mockReturnValue({
      onConflictDoUpdate,
    });
    const insert = vi.fn().mockReturnValue({
      values,
    });
    const repository = new PushTokensRepository({
      insert,
    } as unknown as DbClient);

    const result = await repository.upsert(
      storedPushToken.userId,
      storedPushToken.token
    );

    expect(insert).toHaveBeenCalledWith(pushTokens);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        token: storedPushToken.token,
        userId: storedPushToken.userId,
      })
    );
    expect(onConflictDoUpdate).toHaveBeenCalled();
    expect(result).toEqual(storedPushToken);
  });
});
