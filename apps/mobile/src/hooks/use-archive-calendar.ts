import { useMemo, useState } from "react";
import {
  ARCHIVE_MONTHS_INCREMENT,
  INITIAL_ARCHIVE_MONTHS_COUNT,
} from "@/constants/archive-constants";
import { buildArchiveMonths } from "@/utils/archive-utils";
import { useArchiveData } from "./data/use-archive-data";

export function useArchiveCalendar() {
  const { data } = useArchiveData();
  const [visibleMonthCount, setVisibleMonthCount] = useState(
    INITIAL_ARCHIVE_MONTHS_COUNT
  );
  const archiveMonths = useMemo(
    () => buildArchiveMonths(data ?? [], visibleMonthCount),
    [data, visibleMonthCount]
  );
  const loadMoreMonths = () =>
    setVisibleMonthCount((current) => current + ARCHIVE_MONTHS_INCREMENT);
  return { archiveMonths, loadMoreMonths };
}
