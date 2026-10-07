import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { archives } from "@/lib/db/schema";
import type { ArchiveRepository } from "@/types/archive";

export const archiveRepository: ArchiveRepository = {
  listRecords() {
    return db
      .select({ startAt: archives.startAt, endAt: archives.endAt })
      .from(archives)
      .orderBy(desc(archives.startAt))
      .all();
  },
};
