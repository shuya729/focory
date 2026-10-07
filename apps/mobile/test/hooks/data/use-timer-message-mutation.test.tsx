// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTimerMessageMutation } from "@/hooks/data/use-timer-message-mutation";
import { createQueryWrapper } from "../../query-wrapper";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  read: vi.fn(),
  apiMutation: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/lib/api/client", () => ({
  apiClient: { useMutation: mocks.apiMutation },
}));
vi.mock("@/repositories/settings-repository", () => ({
  settingsRepository: { read: mocks.read },
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
let context: ReturnType<typeof createQueryWrapper>;
const input = {
  timerId: "timer",
  type: "start" as const,
  durationSeconds: 600,
  elapsedSeconds: 0,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.apiMutation.mockReturnValue({ mutateAsync: mocks.generate });
  mocks.read.mockResolvedValue({
    behavior: "rival",
    objective: " 開発 ",
    purpose: " \n ",
  });
  mocks.generate.mockResolvedValue({
    data: { message: { content: "始めましょう" } },
  });
  context = createQueryWrapper();
});
afterEach(() => {
  cleanup();
  context.client.clear();
});
it("保存設定をAPI入力へ変換して生成結果を返す", async () => {
  const { result } = renderHook(() => useTimerMessageMutation(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.mutate(input));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBe("始めましょう");
  expect(mocks.apiMutation).toHaveBeenCalledWith("post", "/v1/messages", {
    retry: false,
  });
  expect(mocks.generate).toHaveBeenCalledWith({
    body: {
      timerId: "timer",
      type: "start",
      durationSec: 600,
      elapsedSec: 0,
      behavior: "rival",
      objective: "開発",
      purpose: null,
    },
  });
});
it.each(["", " \n "])("空の生成結果 %j を拒否する", async (content) => {
  mocks.generate.mockResolvedValue({ data: { message: { content } } });
  const { result } = renderHook(() => useTimerMessageMutation(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.mutate(input));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error).toBeInstanceOf(Error);
});
it("API失敗をErrorとして返し、自動再送しない", async () => {
  mocks.generate.mockRejectedValue({ error: "Too many requests" });
  const { result } = renderHook(() => useTimerMessageMutation(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.mutate(input));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error?.message).toBe("Too many requests");
  expect(mocks.generate).toHaveBeenCalledTimes(1);
});
it("設定取得の失敗時に生成APIを呼ばない", async () => {
  mocks.read.mockRejectedValue(new Error("Read failed"));
  const { result } = renderHook(() => useTimerMessageMutation(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.mutate(input));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(mocks.generate).not.toHaveBeenCalled();
});
