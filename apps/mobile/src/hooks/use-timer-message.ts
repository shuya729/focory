import { useCallback, useEffect, useRef, useState } from "react";
import {
  TIMER_MESSAGE_LOADING_FRAMES,
  TIMER_MESSAGE_LOADING_INTERVAL_MS,
} from "@/constants/timer-constants";
import type { RequestTimerMessageInput } from "@/types/timer";
import { showErrorToast } from "@/utils/toast-utils";
import { useTimerMessageMutation } from "./data/use-timer-message-mutation";
import { useTimerMessageStorage } from "./data/use-timer-message-storage";

export function useTimerMessage() {
  const { mutate, reset, isPending } = useTimerMessageMutation();
  const { query, write } = useTimerMessageStorage();
  const [message, setMessage] = useState("");
  const [frameIndex, setFrameIndex] = useState(0);
  const requestSequence = useRef(0);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || !query.isSuccess) {
      return;
    }
    hasInitialized.current = true;
    setMessage(query.data?.trim() ? query.data : "");
  }, [query.isSuccess, query.data]);
  useEffect(
    () => () => {
      requestSequence.current += 1;
    },
    []
  );

  const clearTimerMessage = useCallback(() => {
    hasInitialized.current = true;
    requestSequence.current += 1;
    reset();
    setMessage("");
    write(null);
  }, [reset, write]);
  const queueTimerMessageUpdate = useCallback(
    (input: RequestTimerMessageInput) => {
      hasInitialized.current = true;
      const sequence = ++requestSequence.current;
      setFrameIndex(0);
      setMessage("");
      write(null);
      mutate(input, {
        onSuccess: (content) => {
          if (requestSequence.current !== sequence) {
            return;
          }
          setMessage(content);
          write(content);
        },
        onError: () => {
          if (requestSequence.current !== sequence) {
            return;
          }
          setMessage("");
          write(null);
          if (input.isMessageFailureFeedbackEnabled !== false) {
            showErrorToast("メッセージの生成に失敗しました");
          }
        },
      });
    },
    [mutate, write]
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
    clearTimerMessage,
    queueTimerMessageUpdate,
    timerMessageState: {
      hasMessage: isPending || Boolean(message),
      isGenerating: isPending,
      message: isPending
        ? (TIMER_MESSAGE_LOADING_FRAMES[frameIndex] ??
          TIMER_MESSAGE_LOADING_FRAMES[0])
        : message,
    },
  };
}
