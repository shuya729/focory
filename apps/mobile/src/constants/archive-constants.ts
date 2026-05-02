export const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export interface DayCategory {
  key: string;
  color: string;
  label: string;
}

export const NONE_DAY_CATEGORY: DayCategory = {
  key: "none",
  color: "bg-muted",
  label: "0h",
} as const;
export const LOW_DAY_CATEGORY: DayCategory = {
  key: "low",
  color: "bg-popover",
  label: "~2h",
} as const;
export const MEDIUM_DAY_CATEGORY: DayCategory = {
  key: "medium",
  color: "bg-accent",
  label: "~4h",
} as const;
export const HIGH_DAY_CATEGORY: DayCategory = {
  key: "high",
  color: "bg-primary",
  label: "~6h",
} as const;
export const VERY_HIGH_DAY_CATEGORY: DayCategory = {
  key: "very-high",
  color: "bg-destructive",
  label: "6h~",
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

export interface CalendarDay {
  dayOfMonth: number | null;
  category: DayCategory | null;
}

export interface ArchiveMonth {
  id: string;
  title: string;
  totalSeconds: number;
  weeks: CalendarDay[][];
}
