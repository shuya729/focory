import type { ArchiveRecord } from "./timer-service";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const HOUR_IN_SECONDS = 60 * 60;

export const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;
export const ARCHIVE_MONTHS_INCREMENT = 3;
export const INITIAL_ARCHIVE_MONTHS_COUNT = 3;

export const LEGEND_ITEMS = [
  { colorClassName: "bg-muted", label: "0h" },
  { colorClassName: "bg-popover", label: "~2h" },
  { colorClassName: "bg-accent", label: "~4h" },
  { colorClassName: "bg-primary", label: "~6h" },
  { colorClassName: "bg-destructive", label: "6h~" },
] as const;

export const CALENDAR_CELL_CLASS_NAMES = {
  accent: "bg-primary",
  "accent-muted": "bg-accent",
  "accent-soft": "bg-popover",
  "accent-strong": "bg-destructive",
  "surface-subtle": "bg-muted",
  transparent: "bg-transparent",
} as const;

export type CalendarCellTone = keyof typeof CALENDAR_CELL_CLASS_NAMES;

export interface CalendarDay {
  dayOfMonth: number | null;
  tone: CalendarCellTone;
}

export interface ArchiveMonthSection {
  id: string;
  title: string;
  totalTimeLabel: string;
  weeks: CalendarDay[][];
}

const formatDayKey = (date: Date) =>
  [
    date.getFullYear().toString(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");

const getMonthStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const getMonthCursor = (date: Date, monthOffset: number) =>
  new Date(date.getFullYear(), date.getMonth() - monthOffset, 1);

const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getFirstDayOfWeekIndex = (date: Date) => getMonthStart(date).getDay();

const getArchiveDate = (value: Date | number) =>
  value instanceof Date ? value : new Date(value);

const toCalendarTone = (totalSeconds: number): CalendarCellTone => {
  if (totalSeconds === 0) {
    return "surface-subtle";
  }

  if (totalSeconds <= HOUR_IN_SECONDS * 2) {
    return "accent-soft";
  }

  if (totalSeconds <= HOUR_IN_SECONDS * 4) {
    return "accent-muted";
  }

  if (totalSeconds <= HOUR_IN_SECONDS * 6) {
    return "accent";
  }

  return "accent-strong";
};

const formatTotalTimeLabel = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / HOUR_IN_SECONDS);
  const minutes = Math.floor((totalSeconds % HOUR_IN_SECONDS) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

const formatMonthTitle = (date: Date) =>
  `${date.getFullYear().toString()}年 ${String(date.getMonth() + 1).padStart(2, "0")}月`;

const accumulateArchiveSecondsByDay = (archiveRecords: ArchiveRecord[]) => {
  const dailySeconds = new Map<string, number>();

  for (const archiveRecord of archiveRecords) {
    const startAt = getArchiveDate(archiveRecord.startAt);
    const endAt = getArchiveDate(archiveRecord.endAt);
    const startAtTime = startAt.getTime();
    const endAtTime = endAt.getTime();

    if (endAtTime <= startAtTime) {
      continue;
    }

    let cursor = getStartOfDay(startAt);

    while (cursor.getTime() < endAtTime) {
      const nextDay = new Date(cursor.getTime() + DAY_IN_MILLISECONDS);
      const segmentStart = Math.max(cursor.getTime(), startAtTime);
      const segmentEnd = Math.min(nextDay.getTime(), endAtTime);

      if (segmentEnd > segmentStart) {
        const dayKey = formatDayKey(cursor);
        const segmentSeconds = Math.floor((segmentEnd - segmentStart) / 1000);
        const currentTotalSeconds = dailySeconds.get(dayKey) ?? 0;

        dailySeconds.set(dayKey, currentTotalSeconds + segmentSeconds);
      }

      cursor = nextDay;
    }
  }

  return dailySeconds;
};

const buildLeadingBlankCells = (firstDayOfWeekIndex: number): CalendarDay[] =>
  Array.from({ length: firstDayOfWeekIndex }, () => ({
    dayOfMonth: null,
    tone: "transparent",
  }));

const buildMonthWeeks = (
  monthDate: Date,
  dailySeconds: Map<string, number>
) => {
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfWeekIndex = getFirstDayOfWeekIndex(monthDate);
  const cells: CalendarDay[] = buildLeadingBlankCells(firstDayOfWeekIndex);

  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth += 1) {
    const currentDate = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      dayOfMonth
    );
    const totalSeconds = dailySeconds.get(formatDayKey(currentDate)) ?? 0;

    cells.push({
      dayOfMonth,
      tone: toCalendarTone(totalSeconds),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      dayOfMonth: null,
      tone: "transparent",
    });
  }

  return Array.from({ length: cells.length / 7 }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7)
  );
};

export function buildArchiveMonthSections(
  archiveRecords: ArchiveRecord[],
  visibleMonthCount: number,
  today = new Date()
) {
  const dailySeconds = accumulateArchiveSecondsByDay(archiveRecords);

  return Array.from({ length: visibleMonthCount }, (_, monthOffset) => {
    const monthDate = getMonthCursor(today, monthOffset);
    const monthStart = getMonthStart(monthDate);
    const nextMonthStart = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1
    );
    let totalSeconds = 0;

    for (const [dayKey, daySeconds] of dailySeconds.entries()) {
      const [year, month, day] = dayKey.split("-").map(Number);

      if (
        year === undefined ||
        month === undefined ||
        day === undefined ||
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day)
      ) {
        continue;
      }

      const currentDate = new Date(year, month - 1, day);

      if (currentDate >= monthStart && currentDate < nextMonthStart) {
        totalSeconds += daySeconds;
      }
    }

    return {
      id: `${monthStart.getFullYear().toString()}-${String(
        monthStart.getMonth() + 1
      ).padStart(2, "0")}`,
      title: formatMonthTitle(monthStart),
      totalTimeLabel: formatTotalTimeLabel(totalSeconds),
      weeks: buildMonthWeeks(monthStart, dailySeconds),
    } satisfies ArchiveMonthSection;
  });
}
