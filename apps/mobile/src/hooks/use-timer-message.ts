import { useCallback, useEffect, useRef, useState } from "react";
import { TIMER_MESSAGE_LOADING_FRAMES } from "@/constants/timer-constants";
import { requestTimerMessage } from "@/services/timer-message-service";
import type {
  RequestTimerMessageInput,
  TimerMessageState,
} from "@/types/timer";
import { showErrorToast } from "@/utils/toast-utils";

const createDefaultMessageState = (): TimerMessageState => ({
  hasMessage: false,
  isGenerating: false,
  message: "",
});

export function useTimerMessage() {
  const latestMessageSequenceRef = useRef(0);
  const [timerMessageState, setTimerMessageState] = useState<TimerMessageState>(
    createDefaultMessageState
  );
  const [messageLoadingFrameIndex, setMessageLoadingFrameIndex] = useState(0);
  const timerMessage = timerMessageState.isGenerating
    ? (TIMER_MESSAGE_LOADING_FRAMES[messageLoadingFrameIndex] ??
      TIMER_MESSAGE_LOADING_FRAMES[0])
    : timerMessageState.message;

  const clearTimerMessage = useCallback(() => {
    latestMessageSequenceRef.current += 1;
    setTimerMessageState(createDefaultMessageState());
  }, []);

  const queueTimerMessageUpdate = useCallback(
    ({
      durationSeconds,
      elapsedSeconds: messageElapsedSeconds,
      timerId,
      type,
    }: RequestTimerMessageInput) => {
      const messageSequence = latestMessageSequenceRef.current + 1;

      latestMessageSequenceRef.current = messageSequence;
      setTimerMessageState({
        hasMessage: true,
        isGenerating: true,
        message: "",
      });

      requestTimerMessage({
        durationSeconds,
        elapsedSeconds: messageElapsedSeconds,
        timerId,
        type,
      })
        .then((message) => {
          if (latestMessageSequenceRef.current === messageSequence) {
            setTimerMessageState({
              hasMessage: true,
              isGenerating: false,
              message,
            });
          }
        })
        .catch((error) => {
          if (latestMessageSequenceRef.current === messageSequence) {
            setTimerMessageState(createDefaultMessageState());
            showErrorToast(error, "メッセージの生成に失敗しました");
          }
        });
    },
    []
  );

  useEffect(() => {
    if (!timerMessageState.isGenerating) {
      setMessageLoadingFrameIndex(0);
      return;
    }

    const intervalId = setInterval(() => {
      setMessageLoadingFrameIndex(
        (currentFrameIndex) =>
          (currentFrameIndex + 1) % TIMER_MESSAGE_LOADING_FRAMES.length
      );
    }, 350);

    return () => {
      clearInterval(intervalId);
    };
  }, [timerMessageState.isGenerating]);

  return {
    clearTimerMessage,
    queueTimerMessageUpdate,
    timerMessageState: {
      ...timerMessageState,
      message: timerMessage,
    },
  };
}
