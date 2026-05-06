import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  TIMER_KEEP_AWAKE_TAG,
  TIMER_TICK_INTERVAL_MS,
} from "@/constants/timer-constants";
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
import {
  calculateElapsedSeconds,
  clampTimerDurationSeconds,
} from "@/utils/timer-utils";
import { showErrorToast } from "@/utils/toast-utils";
import { useTimerMessage } from "./use-timer-message";

interface UseTimerRuntimeOptions {
  onArchiveChanged: () => void;
}

export interface TimerSnapshot {
  elapsedSeconds: number;
  isFinished: boolean;
  isReady: boolean;
  timerMessageState: TimerMessageState;
  timerState: TimerState;
}

export interface TimerActions {
  pauseTimer: () => Promise<void>;
  resetTimer: () => void;
  startOrResumeTimer: () => Promise<void>;
}

export interface TimerPreference {
  durationSeconds: number;
  saveTimerDuration: (durationSeconds: number) => Promise<boolean>;
}

type QueueTimerMessageUpdate = (input: RequestTimerMessageInput) => void;
type ReplaceTimerState = (nextTimerState: TimerState) => void;
type UpdateTimerState = (
  getNextTimerState: (currentTimerState: TimerState) => TimerState
) => void;

const createIdleTimerState = (durationSeconds: number): TimerState => ({
  currentArchiveId: null,
  currentTimerId: null,
  durationSeconds,
  isRunning: false,
  isTransitioning: false,
  remainingSeconds: durationSeconds,
});

export function useTimerRuntime({ onArchiveChanged }: UseTimerRuntimeOptions) {
  const { clearTimerMessage, queueTimerMessageUpdate, timerMessageState } =
    useTimerMessage();
  const { replaceTimerState, timerState, timerStateRef, updateTimerState } =
    useSyncedTimerState(createIdleTimerState(0));
  const { isReady, preferredDurationSeconds, setPreferredDurationSeconds } =
    useInitialTimerState({ replaceTimerState });
  const elapsedSeconds = calculateElapsedSeconds(
    timerState.durationSeconds,
    timerState.remainingSeconds
  );
  const isFinished =
    timerState.currentTimerId !== null &&
    !timerState.isRunning &&
    timerState.remainingSeconds === 0;
  const pauseTimer = usePauseTimer({
    onArchiveChanged,
    queueTimerMessageUpdate,
    timerStateRef,
    updateTimerState,
  });
  const startOrResumeTimer = useStartOrResumeTimer({
    onArchiveChanged,
    queueTimerMessageUpdate,
    timerStateRef,
    updateTimerState,
  });
  const resetTimer = useResetTimer({
    preferredDurationSeconds,
    replaceTimerState,
    timerStateRef,
  });
  const saveTimerDuration = useSaveTimerDuration({
    clearTimerMessage,
    replaceTimerState,
    setPreferredDurationSeconds,
    timerStateRef,
  });

  useTimerTick({
    isRunning: timerState.isRunning,
    updateTimerState,
  });
  useCompleteRunningTimer({
    onArchiveChanged,
    queueTimerMessageUpdate,
    timerState,
    updateTimerState,
  });
  usePauseTimerOnBackground({ pauseTimer });
  useTimerKeepAwake({ isRunning: timerState.isRunning });

  const actions = useMemo(
    () => ({
      pauseTimer,
      resetTimer,
      startOrResumeTimer,
    }),
    [pauseTimer, resetTimer, startOrResumeTimer]
  );
  const preference = useMemo(
    () => ({
      durationSeconds: preferredDurationSeconds,
      saveTimerDuration,
    }),
    [preferredDurationSeconds, saveTimerDuration]
  );
  const snapshot = useMemo(
    () => ({
      elapsedSeconds,
      isFinished,
      isReady,
      timerMessageState,
      timerState,
    }),
    [elapsedSeconds, isFinished, isReady, timerMessageState, timerState]
  );

  return {
    actions,
    preference,
    snapshot,
  };
}

function useSyncedTimerState(initialTimerState: TimerState) {
  const [timerState, setTimerState] = useState(initialTimerState);
  const timerStateRef = useRef(timerState);
  const replaceTimerState = useCallback((nextTimerState: TimerState) => {
    timerStateRef.current = nextTimerState;
    setTimerState(nextTimerState);
  }, []);
  const updateTimerState = useCallback(
    (getNextTimerState: (currentTimerState: TimerState) => TimerState) => {
      const nextTimerState = getNextTimerState(timerStateRef.current);

      replaceTimerState(nextTimerState);
    },
    [replaceTimerState]
  );

  return {
    replaceTimerState,
    timerState,
    timerStateRef,
    updateTimerState,
  };
}

function useInitialTimerState({
  replaceTimerState,
}: {
  replaceTimerState: ReplaceTimerState;
}) {
  const [preferredDurationSeconds, setPreferredDurationSeconds] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadInitialTimerState = async () => {
      const savedDurationSeconds = await getTimerDurationPreference();
      const restoredTimerState =
        await getLatestRestoredTimerState(savedDurationSeconds);
      const durationSeconds = restoredTimerState.currentTimerId
        ? restoredTimerState.durationSeconds
        : savedDurationSeconds;

      if (!isMounted) {
        return;
      }

      setPreferredDurationSeconds(durationSeconds);
      replaceTimerState({
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
          () => {
            if (isMounted) {
              showErrorToast("タイマー設定の保存に失敗しました");
            }
          }
        );
      }
    };

    loadInitialTimerState().catch(() => {
      if (isMounted) {
        setIsReady(true);
        showErrorToast("タイマー状態の読み込みに失敗しました");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [replaceTimerState]);

  return {
    isReady,
    preferredDurationSeconds,
    setPreferredDurationSeconds,
  };
}

function useTimerTick({
  isRunning,
  updateTimerState,
}: {
  isRunning: boolean;
  updateTimerState: UpdateTimerState;
}) {
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      updateTimerState((currentTimerState) => ({
        ...currentTimerState,
        remainingSeconds: Math.max(currentTimerState.remainingSeconds - 1, 0),
      }));
    }, TIMER_TICK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning, updateTimerState]);
}

function useTimerKeepAwake({ isRunning }: { isRunning: boolean }) {
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    activateKeepAwakeAsync(TIMER_KEEP_AWAKE_TAG).catch(() => {
      showErrorToast("画面スリープの抑止に失敗しました");
    });

    return () => {
      deactivateKeepAwake(TIMER_KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [isRunning]);
}

function useCompleteRunningTimer({
  onArchiveChanged,
  queueTimerMessageUpdate,
  timerState,
  updateTimerState,
}: {
  onArchiveChanged: () => void;
  queueTimerMessageUpdate: QueueTimerMessageUpdate;
  timerState: TimerState;
  updateTimerState: UpdateTimerState;
}) {
  const isFinishingRef = useRef(false);

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
    updateTimerState((currentTimerState) => ({
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
        updateTimerState((currentTimerState) => ({
          ...currentTimerState,
          currentArchiveId: null,
        }));
        onArchiveChanged();
        queueTimerMessageUpdate({
          durationSeconds,
          elapsedSeconds: durationSeconds,
          timerId,
          type: "finish",
        });
      } finally {
        isFinishingRef.current = false;
        updateTimerState((currentTimerState) => ({
          ...currentTimerState,
          isTransitioning: false,
        }));
      }
    };

    finishCurrentTimer().catch(() => {
      showErrorToast("タイマーの完了処理に失敗しました");
    });
  }, [onArchiveChanged, queueTimerMessageUpdate, timerState, updateTimerState]);
}

function usePauseTimer({
  onArchiveChanged,
  queueTimerMessageUpdate,
  timerStateRef,
  updateTimerState,
}: {
  onArchiveChanged: () => void;
  queueTimerMessageUpdate: QueueTimerMessageUpdate;
  timerStateRef: RefObject<TimerState>;
  updateTimerState: UpdateTimerState;
}) {
  return useCallback(async () => {
    const currentTimerState = timerStateRef.current;

    if (
      currentTimerState.isTransitioning ||
      !currentTimerState.isRunning ||
      !currentTimerState.currentTimerId ||
      !currentTimerState.currentArchiveId
    ) {
      return;
    }

    const timerId = currentTimerState.currentTimerId;
    const archiveId = currentTimerState.currentArchiveId;
    const durationSeconds = currentTimerState.durationSeconds;
    const pauseElapsedSeconds = calculateElapsedSeconds(
      currentTimerState.durationSeconds,
      currentTimerState.remainingSeconds
    );

    updateTimerState((nextTimerState) => ({
      ...nextTimerState,
      isRunning: false,
      isTransitioning: true,
    }));

    try {
      await pauseTimerSession({
        archiveId,
        elapsedSeconds: pauseElapsedSeconds,
        timerId,
      });
      updateTimerState((nextTimerState) => ({
        ...nextTimerState,
        currentArchiveId: null,
      }));
      onArchiveChanged();
      queueTimerMessageUpdate({
        durationSeconds,
        elapsedSeconds: pauseElapsedSeconds,
        timerId,
        type: "stop",
      });
    } catch {
      updateTimerState((nextTimerState) => ({
        ...nextTimerState,
        isRunning: true,
      }));
      showErrorToast("タイマーの一時停止に失敗しました");
    } finally {
      updateTimerState((nextTimerState) => ({
        ...nextTimerState,
        isTransitioning: false,
      }));
    }
  }, [
    onArchiveChanged,
    queueTimerMessageUpdate,
    timerStateRef,
    updateTimerState,
  ]);
}

function usePauseTimerOnBackground({
  pauseTimer,
}: {
  pauseTimer: () => Promise<void>;
}) {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current;

      appStateRef.current = nextAppState;

      if (previousAppState === "background" || nextAppState !== "background") {
        return;
      }

      pauseTimer().catch(() => {
        showErrorToast("タイマーの一時停止に失敗しました");
      });
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [pauseTimer]);
}

function useStartOrResumeTimer({
  onArchiveChanged,
  queueTimerMessageUpdate,
  timerStateRef,
  updateTimerState,
}: {
  onArchiveChanged: () => void;
  queueTimerMessageUpdate: QueueTimerMessageUpdate;
  timerStateRef: RefObject<TimerState>;
  updateTimerState: UpdateTimerState;
}) {
  return useCallback(async () => {
    const currentTimerState = timerStateRef.current;

    if (
      currentTimerState.isTransitioning ||
      currentTimerState.durationSeconds === 0
    ) {
      return;
    }

    updateTimerState((nextTimerState) => ({
      ...nextTimerState,
      isTransitioning: true,
    }));

    try {
      if (
        currentTimerState.currentTimerId &&
        !currentTimerState.currentArchiveId &&
        currentTimerState.remainingSeconds > 0
      ) {
        const timerId = currentTimerState.currentTimerId;
        const { archiveId } = await restartTimerSession(timerId);

        updateTimerState((nextTimerState) => ({
          ...nextTimerState,
          currentArchiveId: archiveId,
          isRunning: true,
        }));
        onArchiveChanged();
        queueTimerMessageUpdate({
          durationSeconds: currentTimerState.durationSeconds,
          elapsedSeconds: calculateElapsedSeconds(
            currentTimerState.durationSeconds,
            currentTimerState.remainingSeconds
          ),
          timerId,
          type: "restart",
        });
        return;
      }

      const { archiveId, timerId } = await startTimerSession(
        currentTimerState.durationSeconds
      );

      updateTimerState((nextTimerState) => ({
        ...nextTimerState,
        currentArchiveId: archiveId,
        currentTimerId: timerId,
        isRunning: true,
        remainingSeconds: nextTimerState.durationSeconds,
      }));
      onArchiveChanged();
      queueTimerMessageUpdate({
        durationSeconds: currentTimerState.durationSeconds,
        elapsedSeconds: 0,
        timerId,
        type: "start",
      });
    } catch {
      showErrorToast("タイマーの開始に失敗しました");
    } finally {
      updateTimerState((nextTimerState) => ({
        ...nextTimerState,
        isTransitioning: false,
      }));
    }
  }, [
    onArchiveChanged,
    queueTimerMessageUpdate,
    timerStateRef,
    updateTimerState,
  ]);
}

function useResetTimer({
  preferredDurationSeconds,
  replaceTimerState,
  timerStateRef,
}: {
  preferredDurationSeconds: number;
  replaceTimerState: ReplaceTimerState;
  timerStateRef: RefObject<TimerState>;
}) {
  return useCallback(() => {
    const currentTimerState = timerStateRef.current;

    if (currentTimerState.isTransitioning) {
      return;
    }

    replaceTimerState(createIdleTimerState(preferredDurationSeconds));
  }, [preferredDurationSeconds, replaceTimerState, timerStateRef]);
}

function useSaveTimerDuration({
  clearTimerMessage,
  replaceTimerState,
  setPreferredDurationSeconds,
  timerStateRef,
}: {
  clearTimerMessage: () => void;
  replaceTimerState: ReplaceTimerState;
  setPreferredDurationSeconds: (durationSeconds: number) => void;
  timerStateRef: RefObject<TimerState>;
}) {
  return useCallback(
    async (durationSeconds: number) => {
      const nextDurationSeconds = clampTimerDurationSeconds(durationSeconds);

      if (nextDurationSeconds === 0) {
        return false;
      }

      try {
        await saveTimerDurationPreference(nextDurationSeconds);
        setPreferredDurationSeconds(nextDurationSeconds);

        const currentTimerState = timerStateRef.current;

        if (
          !(currentTimerState.isRunning || currentTimerState.isTransitioning)
        ) {
          clearTimerMessage();
          replaceTimerState(createIdleTimerState(nextDurationSeconds));
        }

        return true;
      } catch {
        showErrorToast("タイマー設定の保存に失敗しました");
        return false;
      }
    },
    [
      clearTimerMessage,
      replaceTimerState,
      setPreferredDurationSeconds,
      timerStateRef,
    ]
  );
}
