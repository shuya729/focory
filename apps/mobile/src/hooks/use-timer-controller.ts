import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  TIMER_MESSAGE_LOADING_FRAMES,
  TIMER_TICK_INTERVAL_MS,
} from "@/constants/timer-constants";
import { requestTimerMessage } from "@/services/timer-message-service";
import {
  getTimerDurationPreference,
  saveTimerDurationPreference,
} from "@/services/timer-preference-service";
import {
  finishTimerSession,
  getLatestRestoredTimerState,
  pauseTimerSession,
  restartTimerSession,
  startTimerSession,
} from "@/services/timer-service";
import type {
  RequestTimerMessageInput,
  TimerMessageState,
  TimerState,
} from "@/types/timer";
import { calculateElapsedSeconds } from "@/utils/timer-utils";
import { showErrorToast } from "@/utils/toast-utils";

interface UseTimerControllerOptions {
  onArchiveChanged?: () => void;
}

const createIdleTimerState = (durationSeconds: number): TimerState => ({
  currentArchiveId: null,
  currentTimerId: null,
  durationSeconds,
  isRunning: false,
  isTransitioning: false,
  remainingSeconds: durationSeconds,
});

const createDefaultMessageState = (): TimerMessageState => ({
  hasMessage: false,
  isGenerating: false,
  message: "",
});

export function useTimerController({
  onArchiveChanged,
}: UseTimerControllerOptions = {}) {
  const appStateRef = useRef(AppState.currentState);
  const isFinishingRef = useRef(false);
  const latestMessageSequenceRef = useRef(0);
  const [timerState, setTimerState] = useState<TimerState>(
    createIdleTimerState(0)
  );
  const [timerMessageState, setTimerMessageState] = useState<TimerMessageState>(
    createDefaultMessageState
  );
  const [messageLoadingFrameIndex, setMessageLoadingFrameIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const elapsedSeconds = calculateElapsedSeconds(
    timerState.durationSeconds,
    timerState.remainingSeconds
  );
  const isFinished =
    timerState.currentTimerId !== null &&
    !timerState.isRunning &&
    timerState.remainingSeconds === 0;
  const timerMessage = timerMessageState.isGenerating
    ? (TIMER_MESSAGE_LOADING_FRAMES[messageLoadingFrameIndex] ??
      TIMER_MESSAGE_LOADING_FRAMES[0])
    : timerMessageState.message;

  const clearTimerMessage = useCallback(() => {
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
    let isMounted = true;

    const loadInitialTimerState = async () => {
      const preferredDurationSeconds = await getTimerDurationPreference();
      const restoredTimerState = await getLatestRestoredTimerState(
        preferredDurationSeconds
      );
      const durationSeconds = restoredTimerState.currentTimerId
        ? restoredTimerState.durationSeconds
        : preferredDurationSeconds;

      if (!isMounted) {
        return;
      }

      setTimerState({
        currentArchiveId: null,
        currentTimerId: restoredTimerState.currentTimerId,
        durationSeconds,
        isRunning: false,
        isTransitioning: false,
        remainingSeconds: restoredTimerState.currentTimerId
          ? restoredTimerState.remainingSeconds
          : durationSeconds,
      });
      setIsReady(true);

      if (restoredTimerState.currentTimerId) {
        saveTimerDurationPreference(restoredTimerState.durationSeconds).catch(
          (error) => {
            if (isMounted) {
              showErrorToast(error, "タイマー設定の保存に失敗しました");
            }
          }
        );
      }
    };

    loadInitialTimerState().catch((error) => {
      if (isMounted) {
        setIsReady(true);
        showErrorToast(error, "タイマー状態の読み込みに失敗しました");
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const reloadTimerDurationPreference = async () => {
        if (!isReady || timerState.isRunning || timerState.isTransitioning) {
          return;
        }

        const nextDurationSeconds = await getTimerDurationPreference(
          timerState.durationSeconds
        );

        if (!isActive || nextDurationSeconds === timerState.durationSeconds) {
          return;
        }

        setTimerState(createIdleTimerState(nextDurationSeconds));
        clearTimerMessage();
      };

      reloadTimerDurationPreference().catch((error) => {
        if (isActive) {
          showErrorToast(error, "タイマー設定の読み込みに失敗しました");
        }
      });

      return () => {
        isActive = false;
      };
    }, [
      clearTimerMessage,
      isReady,
      timerState.durationSeconds,
      timerState.isRunning,
      timerState.isTransitioning,
    ])
  );

  useEffect(() => {
    if (!timerState.isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimerState((currentTimerState) => ({
        ...currentTimerState,
        remainingSeconds: Math.max(currentTimerState.remainingSeconds - 1, 0),
      }));
    }, TIMER_TICK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [timerState.isRunning]);

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

  useEffect(() => {
    if (
      !timerState.isRunning ||
      timerState.remainingSeconds !== 0 ||
      isFinishingRef.current ||
      !timerState.currentTimerId ||
      !timerState.currentArchiveId
    ) {
      return;
    }

    const timerId = timerState.currentTimerId;
    const archiveId = timerState.currentArchiveId;
    const durationSeconds = timerState.durationSeconds;

    isFinishingRef.current = true;
    setTimerState((currentTimerState) => ({
      ...currentTimerState,
      isRunning: false,
      isTransitioning: true,
    }));

    const finishCurrentTimer = async () => {
      try {
        await finishTimerSession({
          archiveId,
          durationSeconds,
          timerId,
        });
        setTimerState((currentTimerState) => ({
          ...currentTimerState,
          currentArchiveId: null,
        }));
        onArchiveChanged?.();
        queueTimerMessageUpdate({
          durationSeconds,
          elapsedSeconds: durationSeconds,
          timerId,
          type: "finish",
        });
      } finally {
        isFinishingRef.current = false;
        setTimerState((currentTimerState) => ({
          ...currentTimerState,
          isTransitioning: false,
        }));
      }
    };

    finishCurrentTimer().catch((error) => {
      showErrorToast(error, "タイマーの完了処理に失敗しました");
    });
  }, [
    onArchiveChanged,
    queueTimerMessageUpdate,
    timerState.currentArchiveId,
    timerState.currentTimerId,
    timerState.durationSeconds,
    timerState.isRunning,
    timerState.remainingSeconds,
  ]);

  const pauseCurrentTimer = useCallback(async () => {
    if (
      timerState.isTransitioning ||
      !timerState.isRunning ||
      !timerState.currentTimerId ||
      !timerState.currentArchiveId
    ) {
      return;
    }

    const timerId = timerState.currentTimerId;
    const archiveId = timerState.currentArchiveId;
    const durationSeconds = timerState.durationSeconds;
    const pauseElapsedSeconds = calculateElapsedSeconds(
      timerState.durationSeconds,
      timerState.remainingSeconds
    );

    setTimerState((currentTimerState) => ({
      ...currentTimerState,
      isRunning: false,
      isTransitioning: true,
    }));

    try {
      await pauseTimerSession({
        archiveId,
        elapsedSeconds: pauseElapsedSeconds,
        timerId,
      });
      setTimerState((currentTimerState) => ({
        ...currentTimerState,
        currentArchiveId: null,
      }));
      onArchiveChanged?.();
      queueTimerMessageUpdate({
        durationSeconds,
        elapsedSeconds: pauseElapsedSeconds,
        timerId,
        type: "stop",
      });
    } catch (error) {
      setTimerState((currentTimerState) => ({
        ...currentTimerState,
        isRunning: true,
      }));
      showErrorToast(error, "タイマーの一時停止に失敗しました");
    } finally {
      setTimerState((currentTimerState) => ({
        ...currentTimerState,
        isTransitioning: false,
      }));
    }
  }, [
    onArchiveChanged,
    queueTimerMessageUpdate,
    timerState.currentArchiveId,
    timerState.currentTimerId,
    timerState.durationSeconds,
    timerState.isRunning,
    timerState.isTransitioning,
    timerState.remainingSeconds,
  ]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current;

      appStateRef.current = nextAppState;

      if (!(previousAppState === "active" && nextAppState !== "active")) {
        return;
      }

      pauseCurrentTimer().catch((error) => {
        showErrorToast(error, "タイマーの一時停止に失敗しました");
      });
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [pauseCurrentTimer]);

  const handleStartOrResumeTimer = useCallback(async () => {
    if (timerState.isTransitioning || timerState.durationSeconds === 0) {
      return;
    }

    setTimerState((currentTimerState) => ({
      ...currentTimerState,
      isTransitioning: true,
    }));

    try {
      if (
        timerState.currentTimerId &&
        !timerState.currentArchiveId &&
        timerState.remainingSeconds > 0
      ) {
        const timerId = timerState.currentTimerId;
        const { archiveId } = await restartTimerSession(timerId);

        setTimerState((currentTimerState) => ({
          ...currentTimerState,
          currentArchiveId: archiveId,
          isRunning: true,
        }));
        onArchiveChanged?.();
        queueTimerMessageUpdate({
          durationSeconds: timerState.durationSeconds,
          elapsedSeconds,
          timerId,
          type: "restart",
        });
        return;
      }

      const { archiveId, timerId } = await startTimerSession(
        timerState.durationSeconds
      );

      setTimerState((currentTimerState) => ({
        ...currentTimerState,
        currentArchiveId: archiveId,
        currentTimerId: timerId,
        isRunning: true,
        remainingSeconds: currentTimerState.durationSeconds,
      }));
      onArchiveChanged?.();
      queueTimerMessageUpdate({
        durationSeconds: timerState.durationSeconds,
        elapsedSeconds: 0,
        timerId,
        type: "start",
      });
    } catch (error) {
      showErrorToast(error, "タイマーの開始に失敗しました");
    } finally {
      setTimerState((currentTimerState) => ({
        ...currentTimerState,
        isTransitioning: false,
      }));
    }
  }, [
    elapsedSeconds,
    onArchiveChanged,
    queueTimerMessageUpdate,
    timerState.currentArchiveId,
    timerState.currentTimerId,
    timerState.durationSeconds,
    timerState.isTransitioning,
    timerState.remainingSeconds,
  ]);

  const handlePauseTimer = async () => {
    await pauseCurrentTimer();
  };

  const handleResetTimer = () => {
    if (timerState.isTransitioning) {
      return;
    }

    clearTimerMessage();
    setTimerState(createIdleTimerState(timerState.durationSeconds));
  };

  return {
    elapsedSeconds,
    handlePauseTimer,
    handleResetTimer,
    handleStartOrResumeTimer,
    isFinished,
    isReady,
    timerMessageState: {
      ...timerMessageState,
      message: timerMessage,
    },
    timerState,
  };
}
