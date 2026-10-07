// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTimerPreferenceData } from "@/hooks/data/use-timer-preference-data";
import { createQueryWrapper } from "../../query-wrapper";

const mocks = vi.hoisted(() => ({
  readDuration: vi.fn(),
  saveDuration: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/repositories/timer-preference-repository", () => ({
  timerPreferenceRepository: mocks,
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
let context: ReturnType<typeof createQueryWrapper>;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.readDuration.mockResolvedValue("600");
  context = createQueryWrapper();
});
afterEach(() => {
  cleanup();
  context.client.clear();
});
it.each([
  ["600", 600],
  [null, 0],
  ["invalid", 0],
  ["-1", 0],
])("保存値 %s を %s 秒として読む", async (stored, expected) => {
  mocks.readDuration.mockResolvedValue(stored);
  const { result } = renderHook(() => useTimerPreferenceData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  expect(result.current.query.data).toBe(expected);
});
it("保存成功時にだけ設定時間を更新する", async () => {
  const { result } = renderHook(() => useTimerPreferenceData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => result.current.save.mutate(900));
  await waitFor(() => expect(result.current.save.isSuccess).toBe(true));
  expect(mocks.saveDuration).toHaveBeenCalledWith(900);
  expect(result.current.query.data).toBe(900);
});
it("0秒は永続化せず、保存失敗では前の設定を維持する", async () => {
  const { result } = renderHook(() => useTimerPreferenceData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => result.current.save.mutate(0));
  await waitFor(() => expect(result.current.save.isError).toBe(true));
  expect(mocks.saveDuration).not.toHaveBeenCalled();
  mocks.saveDuration.mockRejectedValue(new Error("Write failed"));
  act(() => result.current.save.mutate(900));
  await waitFor(() => expect(mocks.saveDuration).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(result.current.save.isError).toBe(true));
  expect(result.current.query.data).toBe(600);
});
it("読込失敗を通知する", async () => {
  mocks.readDuration.mockRejectedValue(new Error("Read failed"));
  const { result } = renderHook(() => useTimerPreferenceData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isError).toBe(true));
  expect(mocks.toast).toHaveBeenCalledWith(
    "タイマー設定の読み込みに失敗しました"
  );
});
