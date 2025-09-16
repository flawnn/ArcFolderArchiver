import { PGlite } from "@electric-sql/pglite";
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

/**
 * Creates a fresh in-memory PostgreSQL database for testing
 * Uses PGLite (WASM-compiled Postgres) for fast, isolated tests
 */
export async function createTestDb() {
  const client = new PGlite({
    extensions: { uuid_ossp },
  });
  const db = drizzle(client, { schema });

  // Push schema to the database (equivalent to running migrations)
  await migrate(db, {
    migrationsFolder: "./drizzle/",
  });

  return { db, client };
}

/**
 * Creates minimal test data for essential testing scenarios
 */
export async function createTestData(db: ReturnType<typeof drizzle>) {
  // Simple existing folder for "found" tests
  const existingFolder = await db
    .insert(schema.archivedFolders)
    .values({
      arcId: "12345678-90ab-cdef-1234-567890abcdef",
      folderData: {
        data: {
          items: [
            {
              id: "test-tab",
              parentID: "test-folder",
              childrenIds: [],
              title: "Test Tab",
              createdAt: Date.now(),
              data: {
                tab: {
                  timeLastActiveAt: Date.now(),
                  savedMuteStatus: "false",
                  savedURL: "https://test.com",
                  savedTitle: "Test",
                },
              },
            },
          ],
          rootID: "test-folder",
          root: "test-folder",
        },
        shareID: "test-share",
        author: "Test Author",
      },
    })
    .returning();

  // Folder for deletion tests
  const deletableFolder = await db
    .insert(schema.archivedFolders)
    .values({
      arcId: "98765432-10fe-dcba-9876-543210fedcba",
      folderData: {
        data: { items: [], rootID: "delete-folder", root: "delete-folder" },
        shareID: "delete-share",
        author: "Delete Author",
      },
    })
    .returning();

  return {
    existing: existingFolder[0],
    deletable: deletableFolder[0],
  };
}

/**
 * Creates a test database with essential test data
 * Simplified for performance - always includes test scenarios
 */
export async function setupTestDatabase() {
  const { db, client } = await createTestDb();
  const testData = await createTestData(db);

  return {
    db,
    client,
    testData,
    cleanup: async () => {
      await client.close();
    },
  };
}

export type TestDatabase = Awaited<ReturnType<typeof setupTestDatabase>>;
