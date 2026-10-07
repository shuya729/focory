export const LOCAL_QUERY_OPTIONS = {
  networkMode: "always",
  retry: false,
  staleTime: Number.POSITIVE_INFINITY,
} as const;
export const LOCAL_MUTATION_OPTIONS = {
  networkMode: "always",
  retry: false,
} as const;
export const LOCAL_QUERY_KEYS = {
  settings: ["local", "settings"],
  timerPreference: ["local", "timer-preference"],
  timerMessage: ["local", "timer-message"],
  latestTimer: ["local", "latest-timer"],
  archives: ["local", "archives"],
} as const;
