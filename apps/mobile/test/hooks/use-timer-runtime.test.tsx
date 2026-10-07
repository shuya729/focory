// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTimerRuntime } from "@/hooks/use-timer-runtime";
import type { StoredTimer, TimerState, TimerTransition } from "@/types/timer";
import { createIdleTimerState } from "@/utils/timer-utils";

interface Callbacks<T> {
  onSuccess?: (value: T) => void;
  onError?: () => void;
  onSettled?: () => void;
}
const mocks = vi.hoisted(() => ({
  latest: { isPending: false, data: null as StoredTimer | null },
  duration: { isPending: false, data: 600 },
  isSaving: false,
  start:
    vi.fn<
      (state: TimerState, callbacks: Callbacks<TimerTransition | null>) => void
    >(),
  pause:
    vi.fn<
      (state: TimerState, callbacks: Callbacks<TimerTransition | null>) => void
    >(),
  finish:
    vi.fn<
      (state: TimerState, callbacks: Callbacks<TimerTransition | null>) => void
    >(),
  reset:
    vi.fn<
      (
        input: { state: TimerState; durationSeconds: number },
        callbacks: Callbacks<TimerState | null>
      ) => void
    >(),
  save: vi.fn<(duration: number, callbacks?: Callbacks<number>) => void>(),
  clear: vi.fn(),
  message: vi.fn(),
  lifecycle: vi.fn(),
}));
vi.mock("@/hooks/data/use-timer-persistence", () => ({
  useTimerPersistence: () => ({
    latest: mocks.latest,
    start: { mutate: mocks.start },
    pause: { mutate: mocks.pause },
    finish: { mutate: mocks.finish },
    reset: { mutate: mocks.reset },
  }),
}));
vi.mock("@/hooks/data/use-timer-preference-data", () => ({
  useTimerPreferenceData: () => ({
    query: mocks.duration,
    save: { mutate: mocks.save, isPending: mocks.isSaving },
  }),
}));
vi.mock("@/hooks/use-timer-message", () => ({
  useTimerMessage: () => ({
    clearTimerMessage: mocks.clear,
    queueTimerMessageUpdate: mocks.message,
    timerMessageState: { hasMessage: false, isGenerating: false, message: "" },
  }),
}));
vi.mock("@/hooks/use-timer-lifecycle", () => ({
  useTimerLifecycle: mocks.lifecycle,
}));
const running: TimerState = {
  ...createIdleTimerState(600),
  currentTimerId: "timer",
  currentArchiveId: "archive",
  isRunning: true,
};
const started: TimerTransition = {
  state: running,
  message: {
    timerId: "timer",
    type: "start",
    durationSeconds: 600,
    elapsedSeconds: 0,
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  mocks.latest = { isPending: false, data: null };
  mocks.duration = { isPending: false, data: 600 };
  mocks.isSaving = false;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("読み込みを待って未完了の残り時間を復元し、再取得で巻き戻さない", () => {
  mocks.latest = { isPending: true, data: null };
  const { result, rerender } = renderHook(() => useTimerRuntime());
  expect(result.current.snapshot.isReady).toBe(false);
  mocks.latest = {
    isPending: false,
    data: { id: "timer", durationSeconds: 600, elapsedSeconds: 200 },
  };
  rerender();
  expect(result.current.snapshot.timerState.remainingSeconds).toBe(400);
  mocks.latest.data = { id: "timer", durationSeconds: 600, elapsedSeconds: 0 };
  rerender();
  expect(result.current.snapshot.timerState.remainingSeconds).toBe(400);
});
it("復元タイマーの時間が設定と違う場合は設定保存を要求する", () => {
  mocks.latest.data = {
    id: "timer",
    durationSeconds: 900,
    elapsedSeconds: 300,
  };
  const { result } = renderHook(() => useTimerRuntime());
  expect(result.current.snapshot.timerState.remainingSeconds).toBe(600);
  expect(mocks.save).toHaveBeenCalledWith(900);
});
it("開始連打を1回にまとめ、保存成功後に実行とメッセージを開始する", () => {
  const { result } = renderHook(() => useTimerRuntime());
  act(() => {
    result.current.actions.startOrResumeTimer();
    result.current.actions.startOrResumeTimer();
  });
  expect(mocks.start).toHaveBeenCalledTimes(1);
  expect(result.current.snapshot.timerState.isRunning).toBe(false);
  act(() => {
    mocks.start.mock.calls[0]?.[1].onSuccess?.(started);
    mocks.start.mock.calls[0]?.[1].onSettled?.();
  });
  expect(result.current.snapshot.timerState.isRunning).toBe(true);
  expect(mocks.message).toHaveBeenCalledWith({
    ...started.message,
    isMessageFailureFeedbackEnabled: true,
  });
  act(() => vi.advanceTimersByTime(2000));
  expect(result.current.snapshot.timerState.remainingSeconds).toBe(598);
});
it("開始保存に失敗したら停止状態と時間を維持し、操作ロックを解除する", () => {
  const { result } = renderHook(() => useTimerRuntime());
  act(() => result.current.actions.startOrResumeTimer());
  act(() => {
    mocks.start.mock.calls[0]?.[1].onError?.();
    mocks.start.mock.calls[0]?.[1].onSettled?.();
  });
  expect(result.current.snapshot.timerState).toEqual(createIdleTimerState(600));
  expect(mocks.message).not.toHaveBeenCalled();
});
it("停止保存の失敗では実行状態へ戻す", () => {
  const { result } = renderHook(() => useTimerRuntime());
  act(() => result.current.actions.startOrResumeTimer());
  act(() => mocks.start.mock.calls[0]?.[1].onSuccess?.(started));
  act(() => result.current.actions.pauseTimer());
  expect(result.current.snapshot.timerState.isRunning).toBe(false);
  mocks.message.mockClear();
  act(() => {
    mocks.pause.mock.calls[0]?.[1].onError?.();
    mocks.pause.mock.calls[0]?.[1].onSettled?.();
  });
  expect(result.current.snapshot.timerState.isRunning).toBe(true);
  expect(mocks.message).not.toHaveBeenCalled();
});
it("停止保存成功後にアーカイブを閉じ、stopメッセージを要求する", () => {
  const { result } = renderHook(() => useTimerRuntime());
  act(() => result.current.actions.startOrResumeTimer());
  act(() => mocks.start.mock.calls[0]?.[1].onSuccess?.(started));
  act(() => result.current.actions.pauseTimer());
  const stopped = {
    state: { ...running, isRunning: false, currentArchiveId: null },
    message: { ...started.message, type: "stop" as const },
  };
  act(() => {
    mocks.pause.mock.calls[0]?.[1].onSuccess?.(stopped);
    mocks.pause.mock.calls[0]?.[1].onSettled?.();
  });
  expect(result.current.snapshot.timerState.currentArchiveId).toBeNull();
  expect(mocks.message).toHaveBeenLastCalledWith({
    ...stopped.message,
    isMessageFailureFeedbackEnabled: true,
  });
});
it("残り0秒になったら一度だけ完了を要求し、成功後にfinishメッセージを送る", () => {
  const { result } = renderHook(() => useTimerRuntime());
  act(() => result.current.actions.startOrResumeTimer());
  act(() =>
    mocks.start.mock.calls[0]?.[1].onSuccess?.({
      ...started,
      state: { ...running, remainingSeconds: 1 },
    })
  );
  act(() => vi.advanceTimersByTime(1000));
  expect(mocks.finish).toHaveBeenCalledTimes(1);
  const finished = {
    state: {
      ...running,
      isRunning: false,
      currentArchiveId: null,
      remainingSeconds: 0,
    },
    message: {
      ...started.message,
      type: "finish" as const,
      elapsedSeconds: 600,
    },
  };
  act(() => {
    mocks.finish.mock.calls[0]?.[1].onSuccess?.(finished);
    mocks.finish.mock.calls[0]?.[1].onSettled?.();
  });
  act(() => vi.advanceTimersByTime(3000));
  expect(mocks.finish).toHaveBeenCalledTimes(1);
  expect(result.current.snapshot.isFinished).toBe(true);
  expect(mocks.message).toHaveBeenLastCalledWith({
    ...finished.message,
    isMessageFailureFeedbackEnabled: true,
  });
});
it("リセットは保存成功後に時間とメッセージを戻し、連打を拒否する", () => {
  mocks.latest.data = {
    id: "timer",
    durationSeconds: 600,
    elapsedSeconds: 200,
  };
  const { result } = renderHook(() => useTimerRuntime());
  act(() => {
    result.current.actions.resetTimer();
    result.current.actions.resetTimer();
  });
  expect(mocks.reset).toHaveBeenCalledTimes(1);
  expect(result.current.snapshot.timerState.remainingSeconds).toBe(400);
  act(() => {
    mocks.reset.mock.calls[0]?.[1].onSuccess?.({
      ...createIdleTimerState(600),
      currentTimerId: "timer",
    });
    mocks.reset.mock.calls[0]?.[1].onSettled?.();
  });
  expect(result.current.snapshot.timerState.remainingSeconds).toBe(600);
  expect(mocks.clear).toHaveBeenCalledTimes(1);
});
it("リセット保存失敗では表示とメッセージを維持する", () => {
  mocks.latest.data = {
    id: "timer",
    durationSeconds: 600,
    elapsedSeconds: 200,
  };
  const { result } = renderHook(() => useTimerRuntime());
  act(() => result.current.actions.resetTimer());
  act(() => {
    mocks.reset.mock.calls[0]?.[1].onError?.();
    mocks.reset.mock.calls[0]?.[1].onSettled?.();
  });
  expect(result.current.snapshot.timerState.remainingSeconds).toBe(400);
  expect(result.current.snapshot.timerState.isTransitioning).toBe(false);
  expect(mocks.clear).not.toHaveBeenCalled();
});
it("時間設定の保存成功時だけ停止中の表示を更新して成功通知する", () => {
  const { result } = renderHook(() => useTimerRuntime());
  const onSuccess = vi.fn();
  act(() => result.current.preference.saveTimerDuration(900, { onSuccess }));
  expect(onSuccess).not.toHaveBeenCalled();
  expect(result.current.snapshot.timerState.durationSeconds).toBe(600);
  act(() => mocks.save.mock.calls[0]?.[1]?.onSuccess?.(900));
  expect(result.current.snapshot.timerState.durationSeconds).toBe(900);
  expect(mocks.clear).toHaveBeenCalledTimes(1);
  expect(onSuccess).toHaveBeenCalledTimes(1);
});
it("時間設定保存に失敗したら表示を変えず成功通知もしない", () => {
  const { result } = renderHook(() => useTimerRuntime());
  const onSuccess = vi.fn();
  act(() => result.current.preference.saveTimerDuration(900, { onSuccess }));
  act(() => mocks.save.mock.calls[0]?.[1]?.onError?.());
  expect(result.current.snapshot.timerState.durationSeconds).toBe(600);
  expect(mocks.clear).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
});
it("実行中の時間設定変更は現在のタイマーを変更しない", () => {
  const { result } = renderHook(() => useTimerRuntime());
  act(() => result.current.actions.startOrResumeTimer());
  act(() => mocks.start.mock.calls[0]?.[1].onSuccess?.(started));
  act(() =>
    result.current.preference.saveTimerDuration(900, { onSuccess: vi.fn() })
  );
  act(() => mocks.save.mock.calls[0]?.[1]?.onSuccess?.(900));
  expect(result.current.snapshot.timerState.durationSeconds).toBe(600);
  expect(mocks.clear).not.toHaveBeenCalled();
});

it("ライフサイクルからの停止ではメッセージ失敗通知を抑制する", () => {
  const { result } = renderHook(() => useTimerRuntime());
  act(() => result.current.actions.startOrResumeTimer());
  act(() => mocks.start.mock.calls[0]?.[1].onSuccess?.(started));
  const pauseForLifecycle = mocks.lifecycle.mock.lastCall?.[1];
  act(() => pauseForLifecycle(false));
  const stopped = {
    state: { ...running, isRunning: false, currentArchiveId: null },
    message: { ...started.message, type: "stop" as const },
  };
  act(() => mocks.pause.mock.calls[0]?.[1].onSuccess?.(stopped));
  expect(mocks.message).toHaveBeenLastCalledWith({
    ...stopped.message,
    isMessageFailureFeedbackEnabled: false,
  });
});
