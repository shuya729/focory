import {
  DAY_CATEGORIES,
  type DayCategory,
  NONE_DAY_CATEGORY,
  VERY_HIGH_DAY_CATEGORY,
} from "@/constants/archive-constants";
import type { ArchiveMonth, CalendarDay } from "@/types/archive";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export interface ArchiveInterval {
  endAt: Date | number;
  startAt: Date | number;
}

const getArchiveDate = (value: Date | number) =>
  value instanceof Date ? value : new Date(value);

const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getMonthStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const getMonthCursor = (date: Date, monthOffset: number) =>
  new Date(date.getFullYear(), date.getMonth() - monthOffset, 1);

const formatDayKey = (date: Date) =>
  [
    date.getFullYear().toString(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");

const formatMonthTitle = (date: Date) =>
  `${date.getFullYear().toString()}年 ${String(date.getMonth() + 1).padStart(2, "0")}月`;

const getFirstDayOfWeekIndex = (date: Date) => getMonthStart(date).getDay();

export const getDayCategoryColorClassName = (category: DayCategory | null) =>
  category?.color ?? "bg-transparent";

export const classifyDayCategory = (totalSeconds: number): DayCategory => {
  if (totalSeconds <= 0) {
    return NONE_DAY_CATEGORY;
  }

  return (
    DAY_CATEGORIES.find(
      (dayCategory) =>
        dayCategory.maxSeconds !== null &&
        totalSeconds <= dayCategory.maxSeconds
    ) ?? VERY_HIGH_DAY_CATEGORY
  );
};

const accumulateArchiveSecondsByDay = (archiveRecords: ArchiveInterval[]) => {
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
    category: null,
    dayOfMonth: null,
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
      category: classifyDayCategory(totalSeconds),
      dayOfMonth,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      category: null,
      dayOfMonth: null,
    });
  }

  return Array.from({ length: cells.length / 7 }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7)
  );
};

const calculateMonthTotalSeconds = (
  dailySeconds: Map<string, number>,
  monthStart: Date
) => {
  const nextMonthStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    1
  );
  let totalSeconds = 0;

  for (const [dayKey, daySeconds] of dailySeconds.entries()) {
    const [yearText, monthText, dayText] = dayKey.split("-");

    if (!(yearText && monthText && dayText)) {
      continue;
    }

    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      continue;
    }

    const currentDate = new Date(year, month - 1, day);

    if (currentDate >= monthStart && currentDate < nextMonthStart) {
      totalSeconds += daySeconds;
    }
  }

  return totalSeconds;
};

export const buildArchiveMonths = (
  archiveRecords: ArchiveInterval[],
  visibleMonthCount: number,
  today = new Date()
): ArchiveMonth[] => {
  const dailySeconds = accumulateArchiveSecondsByDay(archiveRecords);

  return Array.from({ length: visibleMonthCount }, (_, monthOffset) => {
    const monthDate = getMonthCursor(today, monthOffset);
    const monthStart = getMonthStart(monthDate);

    return {
      id: `${monthStart.getFullYear().toString()}-${String(
        monthStart.getMonth() + 1
      ).padStart(2, "0")}`,
      title: formatMonthTitle(monthStart),
      totalSeconds: calculateMonthTotalSeconds(dailySeconds, monthStart),
      weeks: buildMonthWeeks(monthStart, dailySeconds),
    };
  });
};
