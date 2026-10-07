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

export interface ArchiveRecord {
  startAt: Date;
  endAt: Date;
}

export interface ArchiveRepository {
  listRecords(): ArchiveRecord[];
}
