import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import type { ArcFolder } from "~/external/models/arc";

const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
};

export const archivedFolders = pgTable("archived_folders", {
  id: text("id").primaryKey().notNull().default(sql`nanoid(21)`),
  arcId: text().notNull().unique(),
  folderData: jsonb().notNull().$type<ArcFolder>(),
  createdAt: timestamp().defaultNow().notNull(),
  lastFetchedAt: timestamp().defaultNow().notNull(),
  deleteAt: timestamp(),
  ...timestamps,
});

