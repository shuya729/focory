import {
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from "@/constants/timer-constants";

const normalizeDurationSeconds = (durationSeconds: number) => {
  if (!Number.isFinite(durationSeconds)) {
    return 0;
  }

  return Math.max(0, Math.trunc(durationSeconds));
};

export const splitTimerDurationSeconds = (durationSeconds: number) => {
  const normalizedDurationSeconds = normalizeDurationSeconds(durationSeconds);

  return {
    minutes: Math.floor(normalizedDurationSeconds / SECONDS_PER_MINUTE),
    seconds: normalizedDurationSeconds % SECONDS_PER_MINUTE,
  };
};

export const toTimerDurationSeconds = (minutes: number, seconds: number) =>
  normalizeDurationSeconds(minutes * SECONDS_PER_MINUTE + seconds);

export const formatTimerClock = (durationSeconds: number) => {
  const { minutes, seconds } = splitTimerDurationSeconds(durationSeconds);

  return [
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
};

export const formatCompactDuration = (durationSeconds: number) => {
  const normalizedDurationSeconds = normalizeDurationSeconds(durationSeconds);
  const hours = Math.floor(normalizedDurationSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (normalizedDurationSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE
  );

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};
