ALTER TABLE "archived_folders" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "archived_folders" DROP COLUMN "deleted_at";