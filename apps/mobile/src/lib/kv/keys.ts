export const SETTINGS_OBJECTIVE_KEY = "focory:settings:objective";
export const SETTINGS_PURPOSE_KEY = "focory:settings:purpose";
export const SETTINGS_BEHAVIOR_KEY = "focory:settings:behavior";
export const TIMER_DURATION_SECONDS_KEY = "focory:timer:duration-seconds";

export type KVKey =
  | typeof SETTINGS_OBJECTIVE_KEY
  | typeof SETTINGS_PURPOSE_KEY
  | typeof SETTINGS_BEHAVIOR_KEY
  | typeof TIMER_DURATION_SECONDS_KEY;

export const KV_KEYS: KVKey[] = [
  SETTINGS_OBJECTIVE_KEY,
  SETTINGS_PURPOSE_KEY,
  SETTINGS_BEHAVIOR_KEY,
  TIMER_DURATION_SECONDS_KEY,
] as const;
