import { useEffect, useState } from "react";
import {
  ARCHIVE_MONTHS_INCREMENT,
  INITIAL_ARCHIVE_MONTHS_COUNT,
} from "@/constants/archive-constants";
import { listArchiveMonths } from "@/services/archive-service";
import type { ArchiveMonth } from "@/types/archive";

interface UseArchiveCalendarOptions {
  refreshKey: number;
}

export function useArchiveCalendar({ refreshKey }: UseArchiveCalendarOptions) {
  const [archiveMonths, setArchiveMonths] = useState<ArchiveMonth[]>([]);
  const [visibleMonthCount, setVisibleMonthCount] = useState(
    INITIAL_ARCHIVE_MONTHS_COUNT
  );

  useEffect(() => {
    let isMounted = true;
    const activeRefreshKey = refreshKey;

    const loadArchives = async () => {
      const nextArchiveMonths = await listArchiveMonths(visibleMonthCount);

      if (isMounted && activeRefreshKey === refreshKey) {
        setArchiveMonths(nextArchiveMonths);
      }
    };

    loadArchives().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [refreshKey, visibleMonthCount]);

  const loadMoreMonths = () => {
    setVisibleMonthCount(
      (currentVisibleMonthCount) =>
        currentVisibleMonthCount + ARCHIVE_MONTHS_INCREMENT
    );
  };

  return { archiveMonths, loadMoreMonths };
}
