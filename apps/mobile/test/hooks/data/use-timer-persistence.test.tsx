// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTimerPersistence } from "@/hooks/data/use-timer-persistence";
import { LOCAL_QUERY_KEYS } from "@/lib/query/options";
import { createIdleTimerState } from "@/utils/timer-utils";
import { createDeferred } from "../../deferred";
import { createQueryWrapper } from "../../query-wrapper";

const mocks = vi.hoisted(() => ({
  latest: vi.fn(),
  start: vi.fn(),
  pause: vi.fn(),
  finish: vi.fn(),
  reset: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/repositories/timer-repository", () => ({
  timerRepository: { findLatestTimer: mocks.latest },
}));
vi.mock("@/services/timer-service", () => ({
  TimerService: class {
    startOrResume = mocks.start;
    pause = mocks.pause;
    finish = mocks.finish;
    reset = mocks.reset;
  },
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
let context: ReturnType<typeof createQueryWrapper>;
const state = createIdleTimerState(600);
beforeEach(() => {
  vi.resetAllMocks();
  context = createQueryWrapper();
});
afterEach(() => {
  cleanup();
  context.client.clear();
});
it("最新タイマーがなければnullを返す", async () => {
  const { result } = renderHook(() => useTimerPersistence(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.latest.isSuccess).toBe(true));
  expect(result.current.latest.data).toBeNull();
});
it.each([
  "start",
  "pause",
  "finish",
] as const)("%s 成功後に最新タイマーと記録を無効化する", async (operation) => {
  mocks[operation].mockReturnValue({
    state,
    message: {
      timerId: "timer",
      type: "start",
      durationSeconds: 600,
      elapsedSeconds: 0,
    },
  });
  const invalidate = vi.spyOn(context.client, "invalidateQueries");
  const { result } = renderHook(() => useTimerPersistence(), {
    wrapper: context.wrapper,
  });
  act(() => result.current[operation].mutate(state));
  await waitFor(() => expect(result.current[operation].isSuccess).toBe(true));
  expect(mocks[operation]).toHaveBeenCalledWith(state);
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: LOCAL_QUERY_KEYS.archives,
  });
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: LOCAL_QUERY_KEYS.latestTimer,
  });
});
it("リセットでは最新タイマーだけを無効化する", async () => {
  mocks.reset.mockReturnValue(state);
  const invalidate = vi.spyOn(context.client, "invalidateQueries");
  const { result } = renderHook(() => useTimerPersistence(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.reset.mutate({ state, durationSeconds: 600 }));
  await waitFor(() => expect(result.current.reset.isSuccess).toBe(true));
  expect(mocks.reset).toHaveBeenCalledWith(state, 600);
  expect(invalidate).toHaveBeenCalledExactlyOnceWith({
    queryKey: LOCAL_QUERY_KEYS.latestTimer,
  });
});
it("操作が無効ならキャッシュを無効化しない", async () => {
  mocks.start.mockReturnValue(null);
  const invalidate = vi.spyOn(context.client, "invalidateQueries");
  const { result } = renderHook(() => useTimerPersistence(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.start.mutate(state));
  await waitFor(() => expect(result.current.start.isSuccess).toBe(true));
  expect(invalidate).not.toHaveBeenCalled();
});
it.each([
  "start",
  "pause",
  "finish",
  "reset",
] as const)("%s 保存失敗は通知し、キャッシュを無効化しない", async (operation) => {
  mocks[operation].mockImplementation(() => {
    throw new Error("Save failed");
  });
  const invalidate = vi.spyOn(context.client, "invalidateQueries");
  const { result } = renderHook(() => useTimerPersistence(), {
    wrapper: context.wrapper,
  });
  act(() => {
    if (operation === "reset") {
      result.current.reset.mutate({ state, durationSeconds: 600 });
    } else {
      result.current[operation].mutate(state);
    }
  });
  await waitFor(() => expect(result.current[operation].isError).toBe(true));
  expect(mocks[operation]).toHaveBeenCalledTimes(1);
  expect(mocks.toast).toHaveBeenCalledTimes(1);
  expect(invalidate).not.toHaveBeenCalled();
});
it("最新タイマーの読み込み失敗を通知する", async () => {
  mocks.latest.mockImplementation(() => {
    throw new Error("Read failed");
  });
  const { result } = renderHook(() => useTimerPersistence(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.latest.isError).toBe(true));
  expect(mocks.toast).toHaveBeenCalledWith(
    "タイマー状態の読み込みに失敗しました"
  );
});

it("開始の保存中は別のMutationである停止も順番を待つ", async () => {
  const pending = createDeferred<null>();
  mocks.start.mockReturnValueOnce(pending.promise);
  mocks.pause.mockReturnValue(null);
  const { result } = renderHook(() => useTimerPersistence(), {
    wrapper: context.wrapper,
  });
  act(() => {
    result.current.start.mutate(state);
    result.current.pause.mutate(state);
  });
  await waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(1));
  expect(mocks.pause).not.toHaveBeenCalled();
  await act(async () => pending.resolve(null));
  await waitFor(() => expect(result.current.pause.isSuccess).toBe(true));
  expect(mocks.pause).toHaveBeenCalledTimes(1);
});
