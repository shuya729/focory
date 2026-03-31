import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

const MAX_TIMER_DURATION_MINUTES = 90;
const DEFAULT_TIMER_DURATION_SECONDS = 25 * 60;

interface TimerDurationContextValue {
  setTimerDurationSeconds: (nextDurationSeconds: number) => void;
  timerDurationSeconds: number;
}

interface TimerDurationProviderProps extends PropsWithChildren {
  initialTimerDurationSeconds?: number;
}

const TimerDurationContext = createContext<TimerDurationContextValue | null>(
  null
);

function clampTimerDurationSeconds(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds)) {
    return DEFAULT_TIMER_DURATION_SECONDS;
  }

  return Math.max(0, Math.trunc(durationSeconds));
}

function splitTimerDuration(durationSeconds: number) {
  const normalizedDurationSeconds = clampTimerDurationSeconds(durationSeconds);

  return {
    minutes: Math.floor(normalizedDurationSeconds / 60),
    seconds: normalizedDurationSeconds % 60,
  };
}

function TimerDurationProvider({
  children,
  initialTimerDurationSeconds = DEFAULT_TIMER_DURATION_SECONDS,
}: TimerDurationProviderProps) {
  const [timerDurationSeconds, setTimerDurationSecondsState] = useState<number>(
    clampTimerDurationSeconds(initialTimerDurationSeconds)
  );

  const setTimerDurationSeconds = (nextDurationSeconds: number) => {
    setTimerDurationSecondsState(
      clampTimerDurationSeconds(nextDurationSeconds)
    );
  };

  return (
    <TimerDurationContext.Provider
      value={{ setTimerDurationSeconds, timerDurationSeconds }}
    >
      {children}
    </TimerDurationContext.Provider>
  );
}

function useTimerDuration() {
  const timerDurationContext = useContext(TimerDurationContext);

  if (!timerDurationContext) {
    throw new Error(
      "useTimerDuration must be used within a TimerDurationProvider."
    );
  }

  return timerDurationContext;
}

export {
  DEFAULT_TIMER_DURATION_SECONDS,
  MAX_TIMER_DURATION_MINUTES,
  TimerDurationProvider,
  clampTimerDurationSeconds,
  splitTimerDuration,
  useTimerDuration,
};
