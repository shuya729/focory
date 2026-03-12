import { sql } from "drizzle-orm";
import {
  check,
  index,
  int,
  integer,
  sqliteTable,
} from "drizzle-orm/sqlite-core";

export const events = sqliteTable(
  "archives",
  {
    id: int("id").primaryKey(),
    startAt: integer("start_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    endAt: integer("end_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    check("start_at_before_end_at", sql`${table.startAt} <= ${table.endAt}`),
    index("archives_start_at_idx").on(table.startAt),
    index("archives_end_at_idx").on(table.endAt),
  ]
);

export default { events };
