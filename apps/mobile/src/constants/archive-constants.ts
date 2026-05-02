import { SECONDS_PER_HOUR } from "@/constants/timer-constants";

export const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;
export const INITIAL_ARCHIVE_MONTHS_COUNT = 3;
export const ARCHIVE_MONTHS_INCREMENT = 3;

export interface DayCategory {
  key: string;
  color: string;
  label: string;
  maxSeconds: number | null;
}

export const NONE_DAY_CATEGORY: DayCategory = {
  key: "none",
  color: "bg-muted",
  label: "0h",
  maxSeconds: 0,
} as const;
export const LOW_DAY_CATEGORY: DayCategory = {
  key: "low",
  color: "bg-popover",
  label: "~2h",
  maxSeconds: 2 * SECONDS_PER_HOUR,
} as const;
export const MEDIUM_DAY_CATEGORY: DayCategory = {
  key: "medium",
  color: "bg-accent",
  label: "~4h",
  maxSeconds: 4 * SECONDS_PER_HOUR,
} as const;
export const HIGH_DAY_CATEGORY: DayCategory = {
  key: "high",
  color: "bg-primary",
  label: "~6h",
  maxSeconds: 6 * SECONDS_PER_HOUR,
} as const;
export const VERY_HIGH_DAY_CATEGORY: DayCategory = {
  key: "very-high",
  color: "bg-destructive",
  label: "6h~",
  maxSeconds: null,
} as const;

export const DAY_CATEGORY = {
  NONE: NONE_DAY_CATEGORY,
  LOW: LOW_DAY_CATEGORY,
  MEDIUM: MEDIUM_DAY_CATEGORY,
  HIGH: HIGH_DAY_CATEGORY,
  VERY_HIGH: VERY_HIGH_DAY_CATEGORY,
} as const;
export const DAY_CATEGORIES: DayCategory[] = [
  NONE_DAY_CATEGORY,
  LOW_DAY_CATEGORY,
  MEDIUM_DAY_CATEGORY,
  HIGH_DAY_CATEGORY,
  VERY_HIGH_DAY_CATEGORY,
] as const;
