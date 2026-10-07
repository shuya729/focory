import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { TIMER_KEEP_AWAKE_TAG } from "@/constants/timer-constants";
import { showErrorToast } from "@/utils/toast-utils";

export function useTimerLifecycle(
  isRunning: boolean,
  pauseTimer: (feedbackEnabled: boolean) => void
) {
  const hasRequestedBackgroundPause = useRef(false);
  useEffect(() => {
    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextState) => {
      const shouldPause =
        previousState !== "background" && nextState === "background";
      previousState = nextState;
      if (nextState !== "background") {
        hasRequestedBackgroundPause.current = false;
      }
      if (shouldPause) {
        hasRequestedBackgroundPause.current = isRunning;
        pauseTimer(false);
      }
    });
    return () => subscription.remove();
  }, [isRunning, pauseTimer]);
  useEffect(() => {
    if (!isRunning) {
      return;
    }
    if (AppState.currentState === "background") {
      if (!hasRequestedBackgroundPause.current) {
        hasRequestedBackgroundPause.current = true;
        pauseTimer(false);
      }
      return;
    }
    activateKeepAwakeAsync(TIMER_KEEP_AWAKE_TAG).catch(() =>
      showErrorToast("画面スリープの抑止に失敗しました")
    );
    return () => {
      deactivateKeepAwake(TIMER_KEEP_AWAKE_TAG).catch(() =>
        showErrorToast("画面スリープの解除に失敗しました")
      );
    };
  }, [isRunning, pauseTimer]);
}
