// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TIMER_MESSAGE_LOADING_INTERVAL_MS } from "@/constants/timer-constants";
import { useTimerMessage } from "@/hooks/use-timer-message";
import type { RequestTimerMessageInput } from "@/types/timer";

interface GenerationCallbacks {
  onSuccess: (content: string) => void;
  onError: () => void;
}
const mocks = vi.hoisted(() => ({
  generate:
    vi.fn<
      (input: RequestTimerMessageInput, callbacks: GenerationCallbacks) => void
    >(),
  reset: vi.fn(),
  write: vi.fn(),
  toast: vi.fn(),
  isPending: false,
  query: { isSuccess: false, data: null as string | null },
}));
vi.mock("@/hooks/data/use-timer-message-mutation", () => ({
  useTimerMessageMutation: () => ({
    mutate: mocks.generate,
    reset: mocks.reset,
    isPending: mocks.isPending,
  }),
}));
vi.mock("@/hooks/data/use-timer-message-storage", () => ({
  useTimerMessageStorage: () => ({ query: mocks.query, write: mocks.write }),
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
const input: RequestTimerMessageInput = {
  timerId: "timer",
  type: "start",
  durationSeconds: 600,
  elapsedSeconds: 0,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  mocks.isPending = false;
  mocks.query = { isSuccess: false, data: null };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("保存メッセージの復元", () => {
  it("有効な保存値を復元し、生成も再保存もしない", () => {
    mocks.query = { isSuccess: true, data: "保存メッセージ" };
    const { result } = renderHook(() => useTimerMessage());
    expect(result.current.timerMessageState).toEqual({
      hasMessage: true,
      isGenerating: false,
      message: "保存メッセージ",
    });
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it.each([null, "", " \n "])("空の保存値 %j は表示しない", (data) => {
    mocks.query = { isSuccess: true, data };
    const { result } = renderHook(() => useTimerMessage());
    expect(result.current.timerMessageState.hasMessage).toBe(false);
  });
  it("遅い読み込みはクリア後の表示を戻さない", () => {
    const { result, rerender } = renderHook(() => useTimerMessage());
    act(() => result.current.clearTimerMessage());
    mocks.query = { isSuccess: true, data: "古い値" };
    rerender();
    expect(result.current.timerMessageState.message).toBe("");
    expect(mocks.write).toHaveBeenCalledWith(null);
  });
  it("遅い読み込みは生成後の表示を上書きしない", () => {
    const { result, rerender } = renderHook(() => useTimerMessage());
    act(() => result.current.queueTimerMessageUpdate(input));
    act(() => mocks.generate.mock.calls[0]?.[1].onSuccess("新しい値"));
    mocks.query = { isSuccess: true, data: "古い値" };
    rerender();
    expect(result.current.timerMessageState.message).toBe("新しい値");
    expect(mocks.write).toHaveBeenLastCalledWith("新しい値");
  });
  it("StrictModeでも復元済みメッセージを表示する", () => {
    mocks.query = { isSuccess: true, data: "保存値" };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    );
    const { result } = renderHook(() => useTimerMessage(), { wrapper });
    expect(result.current.timerMessageState.message).toBe("保存値");
  });
});
describe("生成とクリア", () => {
  it("生成開始時に削除し、成功時に表示と保存を行う", () => {
    mocks.query = { isSuccess: true, data: "前の値" };
    const { result } = renderHook(() => useTimerMessage());
    act(() => result.current.queueTimerMessageUpdate(input));
    expect(result.current.timerMessageState.message).toBe("");
    expect(mocks.write).toHaveBeenCalledWith(null);
    act(() => mocks.generate.mock.calls[0]?.[1].onSuccess("新しい値"));
    expect(result.current.timerMessageState.message).toBe("新しい値");
    expect(mocks.write.mock.calls).toEqual([[null], ["新しい値"]]);
  });
  it("待機中だけローディング表示を更新する", () => {
    const { result, rerender } = renderHook(() => useTimerMessage());
    act(() => result.current.queueTimerMessageUpdate(input));
    mocks.isPending = true;
    rerender();
    expect(result.current.timerMessageState.message).toBe(".");
    act(() => vi.advanceTimersByTime(TIMER_MESSAGE_LOADING_INTERVAL_MS));
    expect(result.current.timerMessageState.message).toBe("..");
    mocks.isPending = false;
    act(() => mocks.generate.mock.calls[0]?.[1].onSuccess("完了"));
    expect(result.current.timerMessageState.isGenerating).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("最新の失敗では削除を要求し、失敗を通知する", () => {
    const { result } = renderHook(() => useTimerMessage());
    act(() => result.current.queueTimerMessageUpdate(input));
    act(() => mocks.generate.mock.calls[0]?.[1].onError());
    expect(result.current.timerMessageState.hasMessage).toBe(false);
    expect(mocks.write.mock.calls).toEqual([[null], [null]]);
    expect(mocks.toast).toHaveBeenCalledWith("メッセージの生成に失敗しました");
  });
  it("バックグラウンド停止の失敗通知は抑制する", () => {
    const { result } = renderHook(() => useTimerMessage());
    act(() =>
      result.current.queueTimerMessageUpdate({
        ...input,
        isMessageFailureFeedbackEnabled: false,
      })
    );
    act(() => mocks.generate.mock.calls[0]?.[1].onError());
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.write).toHaveBeenLastCalledWith(null);
  });
  it.each([
    "success",
    "error",
  ] as const)("古い要求の %s を表示・保存・通知へ反映しない", (outcome) => {
    const { result } = renderHook(() => useTimerMessage());
    act(() => result.current.queueTimerMessageUpdate(input));
    act(() =>
      result.current.queueTimerMessageUpdate({ ...input, type: "stop" })
    );
    act(() => mocks.generate.mock.calls[1]?.[1].onSuccess("最新"));
    mocks.write.mockClear();
    act(() => {
      const callbacks = mocks.generate.mock.calls[0]?.[1];
      if (outcome === "success") {
        callbacks?.onSuccess("古い値");
      } else {
        callbacks?.onError();
      }
    });
    expect(result.current.timerMessageState.message).toBe("最新");
    expect(mocks.write).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });
  it("クリア後の生成応答を保存せず、Mutationをリセットする", () => {
    const { result } = renderHook(() => useTimerMessage());
    act(() => result.current.queueTimerMessageUpdate(input));
    act(() => result.current.clearTimerMessage());
    mocks.write.mockClear();
    act(() => mocks.generate.mock.calls[0]?.[1].onSuccess("表示対象外"));
    expect(result.current.timerMessageState.hasMessage).toBe(false);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("アンマウント後の応答を保存せず、アンマウント自体ではKVを削除しない", () => {
    const { result, unmount } = renderHook(() => useTimerMessage());
    act(() => result.current.queueTimerMessageUpdate(input));
    mocks.write.mockClear();
    unmount();
    act(() => mocks.generate.mock.calls[0]?.[1].onSuccess("表示対象外"));
    expect(mocks.write).not.toHaveBeenCalled();
  });
});
