import { useCallback, useEffect, useState } from "react";
import {
  TIMER_MESSAGE_LOADING_FRAMES,
  TIMER_MESSAGE_LOADING_INTERVAL_MS,
} from "@/constants/timer-constants";
import type { RequestTimerMessageInput } from "@/types/timer";
import { showErrorToast } from "@/utils/toast-utils";
import { useTimerMessageMutation } from "./data/use-timer-message-mutation";

export function useTimerMessage() {
  const { mutate, reset, isPending, isSuccess, data } =
    useTimerMessageMutation();
  const [frameIndex, setFrameIndex] = useState(0);
  const queueTimerMessageUpdate = useCallback(
    (input: RequestTimerMessageInput) => {
      setFrameIndex(0);
      mutate(input, {
        onError: () => {
          if (input.isMessageFailureFeedbackEnabled !== false) {
            showErrorToast("メッセージの生成に失敗しました");
          }
        },
      });
    },
    [mutate]
  );
  useEffect(() => {
    if (!isPending) {
      return;
    }
    const interval = setInterval(
      () =>
        setFrameIndex(
          (current) => (current + 1) % TIMER_MESSAGE_LOADING_FRAMES.length
        ),
      TIMER_MESSAGE_LOADING_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, [isPending]);
  return {
    clearTimerMessage: reset,
    queueTimerMessageUpdate,
    timerMessageState: {
      hasMessage: isPending || isSuccess,
      isGenerating: isPending,
      message: isPending
        ? (TIMER_MESSAGE_LOADING_FRAMES[frameIndex] ??
          TIMER_MESSAGE_LOADING_FRAMES[0])
        : (data ?? ""),
    },
  };
}
