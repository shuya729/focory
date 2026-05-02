import type { DayCategory } from "@/constants/archive-constants";

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
