import { beforeEach, expect, it, vi } from "vitest";
import { getCurrentDevicePushToken } from "@/lib/notifications/client";

const mocks = vi.hoisted(() => ({
  platform: "ios",
  projectId: "project" as string | undefined,
  permissions: vi.fn(),
  request: vi.fn(),
  token: vi.fn(),
  channel: vi.fn(),
}));
vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return mocks.platform;
    },
  },
}));
vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          get projectId() {
            return mocks.projectId;
          },
        },
      },
    },
  },
}));
vi.mock("expo-notifications", () => ({
  AndroidImportance: { MAX: 5 },
  getPermissionsAsync: mocks.permissions,
  requestPermissionsAsync: mocks.request,
  getExpoPushTokenAsync: mocks.token,
  setNotificationChannelAsync: mocks.channel,
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.platform = "ios";
  mocks.projectId = "project";
  mocks.permissions.mockResolvedValue({ status: "granted" });
  mocks.token.mockResolvedValue({ data: "token" });
});
it("Webでは権限要求もトークン取得もしない", async () => {
  mocks.platform = "web";
  expect(await getCurrentDevicePushToken()).toBeNull();
  expect(mocks.permissions).not.toHaveBeenCalled();
  expect(mocks.token).not.toHaveBeenCalled();
});
it("許可済みなら再要求せずプロジェクト指定でトークンを取得する", async () => {
  expect(await getCurrentDevicePushToken()).toBe("token");
  expect(mocks.request).not.toHaveBeenCalled();
  expect(mocks.token).toHaveBeenCalledWith({ projectId: "project" });
});
it("未許可なら権限を要求し、拒否されたらAPI用トークンを返さない", async () => {
  mocks.permissions.mockResolvedValue({ status: "undetermined" });
  mocks.request.mockResolvedValue({ status: "denied" });
  expect(await getCurrentDevicePushToken()).toBeNull();
  expect(mocks.request).toHaveBeenCalledTimes(1);
  expect(mocks.token).not.toHaveBeenCalled();
});
it("権限要求が許可されたらトークンを取得する", async () => {
  mocks.permissions.mockResolvedValue({ status: "undetermined" });
  mocks.request.mockResolvedValue({ status: "granted" });
  expect(await getCurrentDevicePushToken()).toBe("token");
});
it("Androidでは権限確認前に通知チャンネルを作る", async () => {
  mocks.platform = "android";
  await getCurrentDevicePushToken();
  expect(mocks.channel).toHaveBeenCalledWith("default", {
    importance: 5,
    name: "Default",
  });
  expect(mocks.channel.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.permissions.mock.invocationCallOrder[0] ?? 0
  );
});
it("projectIdがなければトークン取得を開始しない", async () => {
  mocks.projectId = undefined;
  await expect(getCurrentDevicePushToken()).rejects.toThrow(
    "Expo projectId is not configured."
  );
  expect(mocks.token).not.toHaveBeenCalled();
});
it("通知SDKの失敗を呼び出し元へ伝える", async () => {
  const error = new Error("SDK failed");
  mocks.token.mockRejectedValue(error);
  await expect(getCurrentDevicePushToken()).rejects.toThrow(error);
});
