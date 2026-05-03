export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
export const MAX_TIMER_DURATION_SECONDS = 90 * SECONDS_PER_MINUTE;
export const TIMER_TICK_INTERVAL_MS = 1000;
export const TIMER_MESSAGE_LOADING_FRAMES = [".", "..", "..."] as const;

export const TIMER_MINUTE_PICKER_ITEMS = Array.from(
  { length: MAX_TIMER_DURATION_SECONDS / SECONDS_PER_MINUTE + 1 },
  (_, value) => ({
    label: value.toString().padStart(2, "0"),
    value,
  })
);

export const TIMER_SECOND_PICKER_ITEMS = Array.from(
  { length: SECONDS_PER_MINUTE },
  (_, value) => ({
    label: value.toString().padStart(2, "0"),
    value,
  })
);
