import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TIMER_TICK_INTERVAL_MS } from "@/constants/timer-constants";
import type {
  TimerMessageState,
  TimerState,
  TimerTransition,
} from "@/types/timer";
import {
  calculateElapsedSeconds,
  createIdleTimerState,
  restoreTimerState,
} from "@/utils/timer-utils";
import { useTimerPersistence } from "./data/use-timer-persistence";
import { useTimerPreferenceData } from "./data/use-timer-preference-data";
import { useTimerLifecycle } from "./use-timer-lifecycle";
import { useTimerMessage } from "./use-timer-message";

export interface TimerSnapshot {
  elapsedSeconds: number;
  isFinished: boolean;
  isReady: boolean;
  timerMessageState: TimerMessageState;
  timerState: TimerState;
}
export interface TimerActions {
  pauseTimer: () => void;
  resetTimer: () => void;
  startOrResumeTimer: () => void;
}
export interface TimerPreference {
  durationSeconds: number;
  isSaving: boolean;
  saveTimerDuration: (
    durationSeconds: number,
    options: { onSuccess: () => void }
  ) => void;
}

export function useTimerRuntime() {
  const { latest, start, pause, finish, reset } = useTimerPersistence();
  const { query: durationQuery, save: saveDuration } = useTimerPreferenceData();
  const hasRestored = useRef(false);
  const { clearTimerMessage, queueTimerMessageUpdate, timerMessageState } =
    useTimerMessage();
  const [timerState, setTimerState] = useState(() => createIdleTimerState(0));
  const timerStateRef = useRef(timerState);
  const preferredDurationSeconds = durationQuery.data ?? 0;
  const [isReady, setIsReady] = useState(false);

  const replaceTimerState = useCallback((state: TimerState) => {
    timerStateRef.current = state;
    setTimerState(state);
  }, []);
  const updateTimerState = useCallback(
    (update: (state: TimerState) => TimerState) => {
      replaceTimerState(update(timerStateRef.current));
    },
    [replaceTimerState]
  );
  const applyTransition = useCallback(
    (transition: TimerTransition, isMessageFailureFeedbackEnabled = true) => {
      replaceTimerState(transition.state);
      queueTimerMessageUpdate({
        ...transition.message,
        isMessageFailureFeedbackEnabled,
      });
    },
    [queueTimerMessageUpdate, replaceTimerState]
  );

  useEffect(() => {
    if (hasRestored.current || durationQuery.isPending || latest.isPending) {
      return;
    }
    hasRestored.current = true;
    const restored = restoreTimerState(
      latest.data ?? null,
      preferredDurationSeconds
    );
    const duration = restored.currentTimerId
      ? restored.durationSeconds
      : preferredDurationSeconds;
    replaceTimerState({
      ...createIdleTimerState(duration),
      currentTimerId: restored.currentTimerId,
      remainingSeconds: restored.currentTimerId
        ? restored.remainingSeconds
        : duration,
    });
    setIsReady(true);
    if (restored.currentTimerId && duration !== preferredDurationSeconds) {
      saveDuration.mutate(duration);
    }
  }, [
    durationQuery.isPending,
    latest.isPending,
    latest.data,
    preferredDurationSeconds,
    replaceTimerState,
    saveDuration.mutate,
  ]);

  useEffect(() => {
    if (!timerState.isRunning) {
      return;
    }
    const interval = setInterval(
      () =>
        updateTimerState((state) =>
          state.isRunning
            ? {
                ...state,
                remainingSeconds: Math.max(state.remainingSeconds - 1, 0),
              }
            : state
        ),
      TIMER_TICK_INTERVAL_MS
    );
    return () => {
      clearInterval(interval);
    };
  }, [timerState.isRunning, updateTimerState]);

  const pauseTimer = useCallback(
    (isMessageFailureFeedbackEnabled = true) => {
      const state = timerStateRef.current;
      if (state.isTransitioning || !state.isRunning) {
        return;
      }
      updateTimerState((current) => ({
        ...current,
        isRunning: false,
        isTransitioning: true,
      }));
      pause.mutate(state, {
        onSuccess: (transition) => {
          if (transition) {
            applyTransition(transition, isMessageFailureFeedbackEnabled);
          } else {
            replaceTimerState(state);
          }
        },
        onError: () => replaceTimerState(state),
        onSettled: () =>
          updateTimerState((current) => ({
            ...current,
            isTransitioning: false,
          })),
      });
    },
    [applyTransition, replaceTimerState, updateTimerState, pause.mutate]
  );

  const startOrResumeTimer = useCallback(() => {
    const state = timerStateRef.current;
    if (state.isTransitioning) {
      return;
    }
    updateTimerState((current) => ({ ...current, isTransitioning: true }));
    start.mutate(state, {
      onSuccess: (transition) => {
        if (transition) {
          applyTransition(transition);
        }
      },
      onSettled: () =>
        updateTimerState((current) => ({ ...current, isTransitioning: false })),
    });
  }, [applyTransition, updateTimerState, start.mutate]);

  useEffect(() => {
    if (!timerState.isRunning || timerState.remainingSeconds !== 0) {
      return;
    }
    const state = timerStateRef.current;
    if (
      state.isTransitioning ||
      !state.isRunning ||
      state.remainingSeconds !== 0 ||
      !state.currentTimerId ||
      !state.currentArchiveId
    ) {
      return;
    }
    updateTimerState((current) => ({
      ...current,
      isRunning: false,
      isTransitioning: true,
    }));
    finish.mutate(state, {
      onSuccess: (transition) => {
        if (transition) {
          applyTransition(transition);
        }
      },
      onSettled: () =>
        updateTimerState((current) => ({ ...current, isTransitioning: false })),
    });
  }, [
    timerState.isRunning,
    timerState.remainingSeconds,
    finish.mutate,
    applyTransition,
    updateTimerState,
  ]);

  useTimerLifecycle(timerState.isRunning, pauseTimer);

  const resetTimer = useCallback(() => {
    const state = timerStateRef.current;
    if (!isReady || state.isTransitioning || state.isRunning) {
      return;
    }
    updateTimerState((current) => ({ ...current, isTransitioning: true }));
    reset.mutate(
      { state, durationSeconds: preferredDurationSeconds },
      {
        onSuccess: (nextState) => {
          if (nextState) {
            replaceTimerState(nextState);
            clearTimerMessage();
          }
        },
        onSettled: () =>
          updateTimerState((current) => ({
            ...current,
            isTransitioning: false,
          })),
      }
    );
  }, [
    isReady,
    preferredDurationSeconds,
    replaceTimerState,
    updateTimerState,
    reset.mutate,
    clearTimerMessage,
  ]);

  const saveTimerDuration = useCallback(
    (durationSeconds: number, options: { onSuccess: () => void }) => {
      saveDuration.mutate(durationSeconds, {
        onSuccess: (duration) => {
          const state = timerStateRef.current;
          if (!(state.isRunning || state.isTransitioning)) {
            clearTimerMessage();
            replaceTimerState(createIdleTimerState(duration));
          }
          options.onSuccess();
        },
      });
    },
    [clearTimerMessage, replaceTimerState, saveDuration.mutate]
  );

  const actions = useMemo(
    () => ({ pauseTimer: () => pauseTimer(), resetTimer, startOrResumeTimer }),
    [pauseTimer, resetTimer, startOrResumeTimer]
  );
  const preference = useMemo(
    () => ({
      durationSeconds: preferredDurationSeconds,
      saveTimerDuration,
      isSaving: saveDuration.isPending,
    }),
    [preferredDurationSeconds, saveTimerDuration, saveDuration.isPending]
  );
  const elapsedSeconds = calculateElapsedSeconds(
    timerState.durationSeconds,
    timerState.remainingSeconds
  );
  const isFinished =
    timerState.currentTimerId !== null &&
    !timerState.isRunning &&
    timerState.remainingSeconds === 0;
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
  return { actions, preference, snapshot };
}
