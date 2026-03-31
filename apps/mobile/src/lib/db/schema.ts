import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { v7 } from "uuid";

export const timers = sqliteTable("timers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v7()),
  durationSec: integer("duration_sec").notNull(),
  elapsedSec: integer("remaining_sec").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

export const archives = sqliteTable(
  "archives",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    timerId: text("timer_id").references(() => timers.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    startAt: integer("start_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    endAt: integer("end_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("start_at_before_end_at", sql`${table.startAt} <= ${table.endAt}`),
    index("archives_timer_id_idx").on(table.timerId),
    index("archives_start_at_idx").on(table.startAt),
    index("archives_end_at_idx").on(table.endAt),
  ]
);

export const timersRelations = relations(timers, ({ many }) => ({
  archives: many(archives),
}));

export const archivesRelations = relations(archives, ({ one }) => ({
  timer: one(timers, {
    fields: [archives.timerId],
    references: [timers.id],
  }),
}));

export const events = archives;

export default {
  archives,
  archivesRelations,
  events,
  timers,
  timersRelations,
};
