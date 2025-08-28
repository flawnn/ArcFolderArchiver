import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { db } from "~/db";
import {
  type ArchivedFolder,
  type NewArchivedFolder,
  archivedFolders,
} from "~/db/schema";

type DatabaseInstance = NodePgDatabase<any> | PgliteDatabase<any>;

class ArchiveRepository {
  private database: DatabaseInstance;

  constructor(database: DatabaseInstance = db) {
    this.database = database;
  }

  /**
   * [AI] A shared wrapper for executing database queries with centralized error handling.
   * This ensures that all unexpected database errors are caught, logged, and then
   * re-thrown to be handled by a higher-level service (e.g., an API route handler).
   */
  private async _executeQuery<T>(query: () => Promise<T>): Promise<T> {
    try {
      return await query();
    } catch (error) {
      console.error("Database query failed:", error);
      throw error; // Re-throw the original error
    }
  }

  async findByArcId(arcId: string): Promise<ArchivedFolder | null> {
    const res = await this._executeQuery(() =>
      this.database
        .select()
        .from(archivedFolders)
        .where(eq(archivedFolders.arcId, arcId))
        .limit(1),
    );

    return res[0] ?? null;
  }

  async findById(id: string): Promise<ArchivedFolder | null> {
    const res = await this._executeQuery(() =>
      this.database
        .select()
        .from(archivedFolders)
        .where(eq(archivedFolders.id, id))
        .limit(1),
    );

    return res[0] ?? null;
  }

  async deleteById(id: string): Promise<boolean> {
    // First, check if the record exists. This handles non-UUIDs gracefully
    // and prevents an unnecessary delete query.
    const existingRecord = await this.findById(id);
    if (!existingRecord) {
      return false;
    }

    await this._executeQuery(() =>
      this.database.delete(archivedFolders).where(eq(archivedFolders.id, id)),
    );

    // Verify the record is actually gone for true idempotency
    const recordAfterDelete = await this.findById(id);
    return recordAfterDelete === null;
  }

  async create(folderData: NewArchivedFolder): Promise<ArchivedFolder[]> {
    return this._executeQuery(() =>
      this.database.insert(archivedFolders).values(folderData).returning(),
    );
  }
}

export { ArchiveRepository };
export const archiveRepository = new ArchiveRepository();
