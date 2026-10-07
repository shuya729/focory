// @vitest-environment jsdom
import { useMutation } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePushTokenRegistration } from "@/hooks/data/use-push-token-registration";
import { createDeferred } from "../../deferred";
import { createQueryWrapper } from "../../query-wrapper";

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  register: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/lib/notifications/client", () => ({
  getCurrentDevicePushToken: mocks.getToken,
}));
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    useMutation: (_method: string, _path: string, options: object) =>
      useMutation({ mutationFn: mocks.register, ...options }),
  },
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
let context: ReturnType<typeof createQueryWrapper>;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getToken.mockResolvedValue("token");
  mocks.register.mockResolvedValue({});
  context = createQueryWrapper();
});
afterEach(() => {
  cleanup();
  context.client.clear();
});
it("トークンを取得した場合だけ登録する", async () => {
  const { result } = renderHook(() => usePushTokenRegistration(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.register());
  await waitFor(() => expect(mocks.register).toHaveBeenCalledTimes(1));
  expect(mocks.register.mock.calls[0]?.[0]).toEqual({
    body: { token: "token" },
  });
});
it("許可されずトークンがなければAPIを呼ばない", async () => {
  mocks.getToken.mockResolvedValue(null);
  const { result } = renderHook(() => usePushTokenRegistration(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.register());
  await waitFor(() => expect(mocks.getToken).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(result.current.isPending).toBe(false));
  expect(mocks.register).not.toHaveBeenCalled();
});
it.each([
  "acquire",
  "register",
] as const)("%s の失敗を通知し、自動再試行しない", async (operation) => {
  const error = new Error("Registration failed");
  const target = operation === "acquire" ? mocks.getToken : mocks.register;
  target.mockRejectedValue(error);
  const { result } = renderHook(() => usePushTokenRegistration(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.register());
  await waitFor(() => expect(result.current.error).toBe(error));
  expect(target).toHaveBeenCalledTimes(1);
  expect(mocks.toast).toHaveBeenCalledWith("通知設定の登録に失敗しました");
  if (operation === "acquire") {
    expect(mocks.register).not.toHaveBeenCalled();
  }
});
it("API登録が完了するまで保存中を表示する", async () => {
  const registration = createDeferred<object>();
  mocks.register.mockReturnValueOnce(registration.promise);
  const { result } = renderHook(() => usePushTokenRegistration(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.register());
  await waitFor(() => expect(mocks.register).toHaveBeenCalledTimes(1));
  expect(result.current.isPending).toBe(true);
  await act(async () => registration.resolve({}));
  await waitFor(() => expect(result.current.isPending).toBe(false));
});
