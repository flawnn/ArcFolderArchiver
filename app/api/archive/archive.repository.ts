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
    const result = await this._executeQuery(() =>
      this.database.delete(archivedFolders).where(eq(archivedFolders.id, id)),
    );

    // Supports both PGLite and PG
    return (result as any)?.rowCount > 0 || (result as any)?.changes > 0;
  }

  async create(folderData: NewArchivedFolder): Promise<ArchivedFolder[]> {
    return this._executeQuery(() =>
      this.database.insert(archivedFolders).values(folderData).returning(),
    );
  }
}

export { ArchiveRepository };
