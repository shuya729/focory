// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTimerDurationEditor } from "@/hooks/use-timer-duration-editor";

const preference = vi.hoisted(() => ({
  durationSeconds: 600,
  isSaving: false,
  saveTimerDuration: vi.fn(),
}));
vi.mock("@/contexts/timer-context", () => ({
  useTimerDurationPreference: () => preference,
}));
beforeEach(() => {
  vi.resetAllMocks();
  preference.durationSeconds = 600;
  preference.isSaving = false;
});
afterEach(cleanup);
it("遅れて取得した設定値を表示し、編集済みの値は上書きしない", () => {
  preference.durationSeconds = 0;
  const { result, rerender } = renderHook(() => useTimerDurationEditor());
  preference.durationSeconds = 600;
  rerender();
  expect(result.current.selectedMinutes).toBe(10);
  act(() => result.current.setSelectedMinutes(15));
  preference.durationSeconds = 1200;
  rerender();
  expect(result.current.selectedMinutes).toBe(15);
});
it("分と秒の編集を保存用の秒数へ変換し、成功時の処理を渡す", () => {
  const { result } = renderHook(() => useTimerDurationEditor());
  const close = vi.fn();
  act(() => {
    result.current.setSelectedMinutes(2);
    result.current.setSelectedSeconds(5);
  });
  act(() => result.current.saveSelectedDuration(close));
  expect(preference.saveTimerDuration).toHaveBeenCalledWith(125, {
    onSuccess: close,
  });
  expect(close).not.toHaveBeenCalled();
});
it("0秒の保存は拒否する", () => {
  const { result } = renderHook(() => useTimerDurationEditor());
  act(() => result.current.setSelectedMinutes(0));
  act(() => result.current.saveSelectedDuration(vi.fn()));
  expect(result.current.isSaveDisabled).toBe(true);
  expect(preference.saveTimerDuration).not.toHaveBeenCalled();
});
it("保存中は追加保存を拒否する", () => {
  preference.isSaving = true;
  const { result } = renderHook(() => useTimerDurationEditor());
  act(() => result.current.saveSelectedDuration(vi.fn()));
  expect(result.current.isSaveDisabled).toBe(true);
  expect(preference.saveTimerDuration).not.toHaveBeenCalled();
});
