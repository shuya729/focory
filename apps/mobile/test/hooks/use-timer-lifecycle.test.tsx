// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TIMER_KEEP_AWAKE_TAG } from "@/constants/timer-constants";
import { useTimerLifecycle } from "@/hooks/use-timer-lifecycle";

const mocks = vi.hoisted(() => ({
  currentState: "active",
  listeners: new Set<(state: string) => void>(),
  activate: vi.fn(),
  deactivate: vi.fn(),
  remove: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("react-native", () => ({
  AppState: {
    get currentState() {
      return mocks.currentState;
    },
    addEventListener: (_event: string, listener: (state: string) => void) => {
      mocks.listeners.add(listener);
      return {
        remove: () => {
          mocks.listeners.delete(listener);
          mocks.remove();
        },
      };
    },
  },
}));
vi.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: mocks.activate,
  deactivateKeepAwake: mocks.deactivate,
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.currentState = "active";
  mocks.listeners.clear();
  mocks.activate.mockResolvedValue(undefined);
  mocks.deactivate.mockResolvedValue(undefined);
});
afterEach(cleanup);
it("実行中だけスリープ抑止し、停止とアンマウントで解除・購読解除する", () => {
  const pause = vi.fn();
  const { rerender, unmount } = renderHook(
    ({ running }) => useTimerLifecycle(running, pause),
    { initialProps: { running: false } }
  );
  expect(mocks.activate).not.toHaveBeenCalled();
  rerender({ running: true });
  expect(mocks.activate).toHaveBeenCalledWith(TIMER_KEEP_AWAKE_TAG);
  rerender({ running: false });
  expect(mocks.deactivate).toHaveBeenCalledWith(TIMER_KEEP_AWAKE_TAG);
  unmount();
  expect(mocks.listeners.size).toBe(0);
});
it("バックグラウンドへの移行で通知抑制付きの停止を一度要求する", () => {
  const pause = vi.fn();
  renderHook(() => useTimerLifecycle(true, pause));
  act(() => {
    mocks.currentState = "background";
    for (const listener of mocks.listeners) {
      listener("background");
      listener("background");
    }
  });
  expect(pause).toHaveBeenCalledExactlyOnceWith(false);
});
it("開始保存中に背景へ移動しても実行開始後に停止を要求する", () => {
  const pause = vi.fn();
  const { rerender } = renderHook(
    ({ running }) => useTimerLifecycle(running, pause),
    { initialProps: { running: false } }
  );
  act(() => {
    mocks.currentState = "background";
    for (const listener of mocks.listeners) {
      listener("background");
    }
  });
  pause.mockClear();
  rerender({ running: true });
  expect(pause).toHaveBeenCalledExactlyOnceWith(false);
  expect(mocks.activate).not.toHaveBeenCalled();
});
it.each([
  "activate",
  "deactivate",
] as const)("%s の失敗を通知する", async (operation) => {
  mocks[operation].mockRejectedValue(new Error("SDK failed"));
  const pause = vi.fn();
  const { rerender } = renderHook(
    ({ running }) => useTimerLifecycle(running, pause),
    { initialProps: { running: true } }
  );
  if (operation === "deactivate") {
    rerender({ running: false });
  }
  await waitFor(() =>
    expect(mocks.toast).toHaveBeenCalledWith(
      operation === "activate"
        ? "画面スリープの抑止に失敗しました"
        : "画面スリープの解除に失敗しました"
    )
  );
});
