-- 1) Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";--> statement-breakpoint

CREATE TABLE "archived_folders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"arc_id" text NOT NULL,
	"folder_data" jsonb NOT NULL,
	"last_fetched_at" timestamp DEFAULT now() NOT NULL,
	"delete_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "archived_folders_arc_id_unique" UNIQUE("arc_id")
);--> statement-breakpoint
