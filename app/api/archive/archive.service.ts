import { arcClient } from "../../external/arc.client";
import { ArchiveRepository } from "./archive.repository";

export class ArchiveService {
  private repository: ArchiveRepository;
  constructor(repository: ArchiveRepository = new ArchiveRepository()) {
    this.repository = repository;
  }
  async getOrCreateFolder(
    arcId: string,
    deleteInDays: number,
  ): Promise<any | null> {
    if (deleteInDays <= 0) {
      throw new Error(
        "Invalid input parameters - Check the deleteInDays",
      );
    }

    // 2. Check if the folder already exists in our database
    const existingFolder = await this.repository.findByArcId(arcId);

    if (existingFolder) {
      return existingFolder;
    }

    // 3. If not, fetch the folder data from the external Arc client
    const folderData = await arcClient.extractFolderData(arcId);

    if (!folderData) {
      throw new Error("Failed to fetch folder data from Arc.");
    }

    // 4. Calculate the deletion date
    const deleteAt = new Date();
    deleteAt.setDate(deleteAt.getDate() + deleteInDays);

    // 5. Create the new folder record in our database
    const newFolder = await this.repository.create({
      arcId,
      folderData,
      deleteAt,
    });

    return newFolder[0] ?? null;
  }

  async deleteFolder(id: string): Promise<boolean> {
    // Basic input validation
    if (!id || !id.trim()) {
      throw new Error("Invalid ID parameter.");
    }

    // A simple regex to check for UUID-like format.
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error("ID does not match expected format.");
    }

    return this.repository.deleteById(id);
  }
}

export const archiveService = new ArchiveService();
