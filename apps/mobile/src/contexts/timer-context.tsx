import { createContext, type ReactNode, useContext } from "react";
import { useInvalidateArchives } from "@/contexts/archive-invalidation-context";
import {
  type TimerActions,
  type TimerPreference,
  type TimerSnapshot,
  useTimerRuntime,
} from "@/hooks/use-timer-runtime";

interface TimerProviderProps {
  children: ReactNode;
}

const TimerStateContext = createContext<TimerSnapshot | null>(null);
const TimerActionsContext = createContext<TimerActions | null>(null);
const TimerPreferenceContext = createContext<TimerPreference | null>(null);

function useRequiredContext<T>(contextValue: T | null, hookName: string) {
  if (contextValue === null) {
    throw new Error(`${hookName} must be used within TimerProvider`);
  }

  return contextValue;
}

export function TimerProvider({ children }: TimerProviderProps) {
  const invalidateArchives = useInvalidateArchives();
  const { actions, preference, snapshot } = useTimerRuntime({
    onArchiveChanged: invalidateArchives,
  });

  return (
    <TimerStateContext.Provider value={snapshot}>
      <TimerActionsContext.Provider value={actions}>
        <TimerPreferenceContext.Provider value={preference}>
          {children}
        </TimerPreferenceContext.Provider>
      </TimerActionsContext.Provider>
    </TimerStateContext.Provider>
  );
}

export function useTimerState() {
  return useRequiredContext(useContext(TimerStateContext), "useTimerState");
}

export function useTimerActions() {
  return useRequiredContext(useContext(TimerActionsContext), "useTimerActions");
}

export function useTimer() {
  return {
    ...useTimerState(),
    ...useTimerActions(),
  };
}

export function useTimerDurationPreference() {
  return useRequiredContext(
    useContext(TimerPreferenceContext),
    "useTimerDurationPreference"
  );
}
