import { afterEach, describe, expect, it, vi } from "vitest";
import { PushNotificationService } from "../../src/services/push-notifications";

const createJsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const stubFetch = (...responses: Response[]) => {
  const fetchMock = vi.fn();

  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("PushNotificationService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("user に紐づく token がなければ送信しない", async () => {
    const fetchMock = stubFetch();
    const findByUserId = vi.fn().mockResolvedValue([]);
    const deleteByToken = vi.fn();
    const service = new PushNotificationService(
      { findByUserId, deleteByToken },
      {
        receiptsUrl: "",
        sendUrl: "",
      }
    );

    await service.sendToUser("user-1", {
      title: "Focory",
      body: "通知本文",
    });

    expect(findByUserId).toHaveBeenCalledWith("user-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("送信 ticket が DeviceNotRegistered なら token を削除する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const token = "ExponentPushToken[dead-token]";
    stubFetch(
      createJsonResponse({
        data: {
          status: "error",
          message: "not registered",
          details: {
            error: "DeviceNotRegistered",
          },
        },
      })
    );
    const findByUserId = vi.fn().mockResolvedValue([{ token }]);
    const deleteByToken = vi.fn().mockResolvedValue(undefined);
    const service = new PushNotificationService(
      { findByUserId, deleteByToken },
      {
        receiptsUrl: "https://example.com/push/getReceipts",
        sendUrl: "https://example.com/push/send",
      }
    );

    await service.sendToUser("user-1", {
      title: "Focory",
      body: "少し区切れました。",
    });

    expect(deleteByToken).toHaveBeenCalledWith(token);
  });

  it("receipt が DeviceNotRegistered なら token を削除する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const token = "ExponentPushToken[dead-token]";
    const fetchMock = stubFetch(
      createJsonResponse({
        data: {
          status: "ok",
          id: "ticket-1",
        },
      }),
      createJsonResponse({
        data: {
          "ticket-1": {
            status: "error",
            message: "not registered",
            details: {
              error: "DeviceNotRegistered",
            },
          },
        },
      })
    );
    const findByUserId = vi.fn().mockResolvedValue([{ token }]);
    const deleteByToken = vi.fn().mockResolvedValue(undefined);
    const service = new PushNotificationService(
      { findByUserId, deleteByToken },
      {
        receiptsUrl: "https://example.com/push/getReceipts",
        sendUrl: "https://example.com/push/send",
      }
    );

    await service.sendToUser("user-1", {
      title: "Focory",
      body: "少し区切れました。",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(deleteByToken).toHaveBeenCalledWith(token);
  });

  it("token があるのに Expo 設定が不足していれば失敗する", async () => {
    const findByUserId = vi
      .fn()
      .mockResolvedValue([{ token: "ExponentPushToken[token]" }]);
    const deleteByToken = vi.fn();
    const service = new PushNotificationService(
      { findByUserId, deleteByToken },
      {
        receiptsUrl: "",
        sendUrl: "https://example.com/push/send",
      }
    );

    await expect(
      service.sendToUser("user-1", {
        title: "Focory",
        body: "通知本文",
      })
    ).rejects.toThrow("Expo push notification is not configured");
  });
  it.each([
    {
      name: "HTTP エラー",
      body: { errors: [{ message: "upstream unavailable" }] },
      status: 503,
    },
    { name: "ticket の欠落", body: {}, status: 200 },
    {
      name: "DeviceNotRegistered 以外のエラー",
      body: { data: { status: "error", details: { error: "MessageTooBig" } } },
      status: 200,
    },
  ])("$name は記録して継続し、token を削除しない", async ({ body, status }) => {
    const logError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    stubFetch(createJsonResponse(body, status));
    const deleteByToken = vi.fn();
    const service = new PushNotificationService(
      { findByUserId: vi.fn(), deleteByToken },
      {
        receiptsUrl: "https://example.com/push/getReceipts",
        sendUrl: "https://example.com/push/send",
      }
    );
    await expect(
      service.sendToTokens(["ExponentPushToken[token]"], {
        title: "Focory",
        body: "通知本文",
      })
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
    expect(deleteByToken).not.toHaveBeenCalled();
  });

  it("空の token 配列なら設定不足でも送信しない", async () => {
    const fetchMock = stubFetch();
    const service = new PushNotificationService(
      { findByUserId: vi.fn(), deleteByToken: vi.fn() },
      { receiptsUrl: "", sendUrl: "" }
    );
    await service.sendToTokens([], { title: "Focory", body: "通知本文" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("receipt がまだ存在しなくても成功として継続する", async () => {
    const fetchMock = stubFetch(
      createJsonResponse({ data: [{ status: "ok", id: "ticket-1" }] }),
      createJsonResponse({ data: {} })
    );
    const deleteByToken = vi.fn();
    const service = new PushNotificationService(
      { findByUserId: vi.fn(), deleteByToken },
      {
        receiptsUrl: "https://example.com/push/getReceipts",
        sendUrl: "https://example.com/push/send",
      }
    );
    await service.sendToTokens(["ExponentPushToken[token]"], {
      title: "Focory",
      body: "通知本文",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(deleteByToken).not.toHaveBeenCalled();
  });
});
