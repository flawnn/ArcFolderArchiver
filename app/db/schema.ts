import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import type { ArcFolder } from "~/external/models/arc";

const timestamps = {
  updated_at: timestamp("updated_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
};

export const archivedFolders = pgTable("archived_folders", {
  id: uuid("id").primaryKey().notNull().default(sql`uuid_generate_v4()`),
  arcId: text("arc_id").notNull().unique(),
  folderData: jsonb("folder_data").notNull().$type<ArcFolder>(),
  lastFetchedAt: timestamp("last_fetched_at").defaultNow().notNull(),
  deleteAt: timestamp("delete_at"),
  ...timestamps,
});

export type ArchivedFolder = typeof archivedFolders.$inferSelect;
export type NewArchivedFolder = typeof archivedFolders.$inferInsert;
