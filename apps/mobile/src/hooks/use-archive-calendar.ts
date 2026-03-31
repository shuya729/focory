import { useEffect, useState } from "react";
import { useArchiveRefresh } from "@/contexts/archive-refresh-context";
import {
  ARCHIVE_MONTHS_INCREMENT,
  buildArchiveMonthSections,
  INITIAL_ARCHIVE_MONTHS_COUNT,
} from "@/services/archive-service";
import { type ArchiveRecord, listArchives } from "@/services/timer-service";

export function useArchiveCalendar() {
  const { refreshKey } = useArchiveRefresh();
  const [archiveRecords, setArchiveRecords] = useState<ArchiveRecord[]>([]);
  const [visibleMonthCount, setVisibleMonthCount] = useState(
    INITIAL_ARCHIVE_MONTHS_COUNT
  );

  useEffect(() => {
    let isMounted = true;
    const activeRefreshKey = refreshKey;

    const loadArchives = async () => {
      const nextArchiveRecords = await listArchives();

      if (isMounted && activeRefreshKey === refreshKey) {
        setArchiveRecords(nextArchiveRecords);
      }
    };

    loadArchives().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const loadMoreMonths = () => {
    setVisibleMonthCount(
      (currentVisibleMonthCount) =>
        currentVisibleMonthCount + ARCHIVE_MONTHS_INCREMENT
    );
  };

  return {
    loadMoreMonths,
    monthSections: buildArchiveMonthSections(archiveRecords, visibleMonthCount),
  };
}
