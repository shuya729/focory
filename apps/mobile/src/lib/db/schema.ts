import { sql } from "drizzle-orm";
import { check, int, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const events = sqliteTable(
  "events",
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
  ]
);

export default { events };
