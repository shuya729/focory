export const MESSAGE_TYPE_VALUES = [
  "start",
  "stop",
  "restart",
  "finish",
] as const;

export const BEHAVIOR_VALUES = [
  "supporter",
  "rival",
  "cool",
  "coach",
  "swordsman",
  "trickster",
] as const;

export const MESSAGE_RATE_LIMIT = {
  limit: 100,
  window: "5 h",
  prefix: "focory:ratelimit:messages",
} as const;
