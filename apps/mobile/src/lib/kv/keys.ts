export const SETTINGS_OBJECTIVE_KEY = "focory:settings:objective";
export const SETTINGS_PURPOSE_KEY = "focory:settings:purpose";
export const SETTINGS_BEHAVIOR_KEY = "focory:settings:behavior";

export type KVKey =
  | typeof SETTINGS_OBJECTIVE_KEY
  | typeof SETTINGS_PURPOSE_KEY
  | typeof SETTINGS_BEHAVIOR_KEY;

export const KV_KEYS: KVKey[] = [
  SETTINGS_OBJECTIVE_KEY,
  SETTINGS_PURPOSE_KEY,
  SETTINGS_BEHAVIOR_KEY,
] as const;
