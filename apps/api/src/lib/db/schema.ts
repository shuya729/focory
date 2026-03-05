import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const _base = {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const users = pgTable("users", {
  ..._base,
  authId: text("auth_id").notNull().unique(),
  name: varchar("name", { length: 250 }).notNull(),
  objectId: uuid("object_id").references(() => objects.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
});

export const objectTypes = ["user"] as const;
export const ObjectTypes = pgEnum("object_type", objectTypes);

export const objectStatuses = [
  "pending",
  "available",
  "rejected",
  "deleted",
] as const;
export const ObjectStatus = pgEnum("object_status", objectStatuses);

export const objectContentTypes = ["image/png", "image/jpeg"] as const;
export const ObjectContentTypes = pgEnum(
  "object_content_type",
  objectContentTypes
);

export const objects = pgTable("objects", {
  ..._base,
  key: text("key").notNull().unique(),
  type: ObjectTypes("type").notNull(),
  status: ObjectStatus("status").notNull().default("pending"),
  contentType: ObjectContentTypes("content_type").notNull(),
});
