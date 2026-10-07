// @vitest-environment jsdom
import { onlineManager } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTimerMessageStorage } from "@/hooks/data/use-timer-message-storage";
import { LOCAL_QUERY_KEYS } from "@/lib/query/options";
import { createDeferred } from "../../deferred";
import { createQueryWrapper } from "../../query-wrapper";

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  save: vi.fn(),
  clear: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/repositories/timer-message-repository", () => ({
  timerMessageRepository: mocks,
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
let context: ReturnType<typeof createQueryWrapper>;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.read.mockResolvedValue("保存値");
  context = createQueryWrapper();
});
afterEach(() => {
  cleanup();
  context.client.clear();
  onlineManager.setOnline(true);
});
it("保存値を読み、保存・削除成功時にキャッシュも更新する", async () => {
  const { result } = renderHook(() => useTimerMessageStorage(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.data).toBe("保存値"));
  act(() => result.current.write("新値"));
  await waitFor(() => expect(result.current.query.data).toBe("新値"));
  act(() => result.current.write(null));
  await waitFor(() => expect(result.current.query.data).toBeNull());
  expect(mocks.save).toHaveBeenCalledWith("新値");
  expect(mocks.clear).toHaveBeenCalledTimes(1);
});
it("保存処理中に要求された削除を保存後に実行する", async () => {
  const save = createDeferred<void>();
  mocks.save.mockReturnValueOnce(save.promise);
  const { result } = renderHook(() => useTimerMessageStorage(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => {
    result.current.write("新値");
    result.current.write(null);
  });
  await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
  expect(mocks.clear).not.toHaveBeenCalled();
  await act(async () => save.resolve());
  await waitFor(() => expect(mocks.clear).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(result.current.query.data).toBeNull());
});
it("削除後に届いた遅い初期読込でキャッシュを戻さない", async () => {
  const read = createDeferred<string>();
  mocks.read.mockReturnValueOnce(read.promise);
  const { result } = renderHook(() => useTimerMessageStorage(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.write(null));
  await waitFor(() => expect(result.current.query.data).toBeNull());
  await act(async () => read.resolve("古い値"));
  expect(context.client.getQueryData(LOCAL_QUERY_KEYS.timerMessage)).toBeNull();
});
it.each([
  "save",
  "clear",
] as const)("%s の失敗時はキャッシュを変えずに通知する", async (operation) => {
  mocks[operation].mockRejectedValue(new Error("Write failed"));
  const { result } = renderHook(() => useTimerMessageStorage(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => result.current.write(operation === "save" ? "新値" : null));
  await waitFor(() =>
    expect(mocks.toast).toHaveBeenCalledWith(
      operation === "save"
        ? "メッセージの保存に失敗しました"
        : "メッセージの削除に失敗しました"
    )
  );
  expect(result.current.query.data).toBe("保存値");
  expect(mocks[operation]).toHaveBeenCalledTimes(1);
});
it("先の保存に失敗しても後続の削除を実行する", async () => {
  mocks.save.mockRejectedValue(new Error("Write failed"));
  const { result } = renderHook(() => useTimerMessageStorage(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => {
    result.current.write("新値");
    result.current.write(null);
  });
  await waitFor(() => expect(result.current.query.data).toBeNull());
  expect(mocks.clear).toHaveBeenCalledTimes(1);
});
it("オフラインでも読み込みと削除を実行する", async () => {
  onlineManager.setOnline(false);
  const { result } = renderHook(() => useTimerMessageStorage(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.data).toBe("保存値"));
  act(() => result.current.write(null));
  await waitFor(() => expect(result.current.query.data).toBeNull());
});
it("読み込み失敗を通知する", async () => {
  mocks.read.mockRejectedValue(new Error("Read failed"));
  const { result } = renderHook(() => useTimerMessageStorage(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isError).toBe(true));
  expect(mocks.toast).toHaveBeenCalledWith(
    "メッセージの読み込みに失敗しました"
  );
});
