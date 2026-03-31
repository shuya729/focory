import { createContext, type PropsWithChildren, useContext } from "react";
import type { RestoredTimerState } from "@/services/timer-service";

interface RestoredTimerStateProviderProps extends PropsWithChildren {
  restoredTimerState: RestoredTimerState;
}

const RestoredTimerStateContext = createContext<RestoredTimerState | null>(
  null
);

export function RestoredTimerStateProvider({
  children,
  restoredTimerState,
}: RestoredTimerStateProviderProps) {
  return (
    <RestoredTimerStateContext.Provider value={restoredTimerState}>
      {children}
    </RestoredTimerStateContext.Provider>
  );
}

export function useRestoredTimerState() {
  const restoredTimerState = useContext(RestoredTimerStateContext);

  if (!restoredTimerState) {
    throw new Error(
      "useRestoredTimerState must be used within a RestoredTimerStateProvider."
    );
  }

  return restoredTimerState;
}
