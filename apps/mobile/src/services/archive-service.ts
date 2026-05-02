import { INITIAL_ARCHIVE_MONTHS_COUNT } from "@/constants/archive-constants";
import { listArchiveRecords } from "@/services/timer-service";
import type { ArchiveMonth } from "@/types/archive";
import { buildArchiveMonths } from "@/utils/archive-utils";

export async function listArchiveMonths(
  visibleMonthCount = INITIAL_ARCHIVE_MONTHS_COUNT
): Promise<ArchiveMonth[]> {
  const archiveRecords = await listArchiveRecords();

  return buildArchiveMonths(archiveRecords, visibleMonthCount);
}
