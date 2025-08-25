-- 1) Enable pgcrypto (once per DB)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) URL-safe 64-char alphabet (0-9, a-z, A-Z, - and _)
CREATE OR REPLACE FUNCTION nanoid(size int DEFAULT 21)
RETURNS text
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  alphabet constant text := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
  id text := '';
  b bytea;
BEGIN
  WHILE length(id) < size LOOP
    b := gen_random_bytes(1);
    -- get_byte returns 0..255; mask to 0..63 for uniform selection
    id := id || substr(alphabet, (get_byte(b,0) & 63) + 1, 1);
  END LOOP;
  RETURN id;
END $$;

CREATE TABLE "archived_folders" (
	"id" text PRIMARY KEY DEFAULT nanoid(21) NOT NULL,
	"arc_id" text NOT NULL,
	"folder_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_fetched_at" timestamp DEFAULT now() NOT NULL,
	"delete_at" timestamp,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "archived_folders_arcId_unique" UNIQUE("arc_id")
);
