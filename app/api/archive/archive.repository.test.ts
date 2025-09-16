import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import crypto from "node:crypto";
import type { TestDatabase } from "../../db/test";
import { setupTestDatabase } from "../../db/test";
import { ArchiveRepository } from "./archive.repository";

describe("ArchiveRepository - Essential Tests", () => {
  let testDb: TestDatabase;
  let repository: ArchiveRepository;

  beforeEach(async () => {
    testDb = await setupTestDatabase();
    repository = new ArchiveRepository(testDb.db);
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe("findByArcId", () => {
    it("should return folder when arc ID exists", async () => {
      const result = await repository.findByArcId(
        "12345678-90ab-cdef-1234-567890abcdef",
      );

      expect(result).not.toBeNull();
      expect(result?.arcId).toBe("12345678-90ab-cdef-1234-567890abcdef");
      expect(result?.folderData.author).toBe("Test Author");
    });

    it("should return null when arc ID does not exist", async () => {
      const result = await repository.findByArcId("NONEXISTENT");

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return folder when ID exists", async () => {
      const existingFolder = testDb.testData.existing;

      const result = await repository.findById(existingFolder.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(existingFolder.id);
      expect(result?.arcId).toBe("12345678-90ab-cdef-1234-567890abcdef");
    });

    it("should return null when ID does not exist", async () => {
      const result = await repository.findById(crypto.randomUUID());

      expect(result).toBeNull();
    });
  });

  describe("deleteById", () => {
    it("should delete existing folder and return true", async () => {
      const folderToDelete = testDb.testData.deletable;

      const result = await repository.deleteById(folderToDelete.id);

      expect(result).toBe(true);

      // Verify it's gone
      const deletedFolder = await repository.findById(folderToDelete.id);
      expect(deletedFolder).toBeNull();
    });

    it("should return false when folder does not exist", async () => {
      const result = await repository.deleteById(crypto.randomUUID());

      expect(result).toBe(false);
    });
  });

  describe("create", () => {
    it("should create folder and return created data", async () => {
      const newFolderData = {
        arcId: "NEW-FOLDER",
        folderData: {
          data: {
            items: [],
            rootID: "new-root",
            root: "new-root",
          },
          shareID: "new-share",
          author: "New Author",
        },
      };

      const result = await repository.create(newFolderData);

      expect(result).toHaveLength(1);
      expect(result[0].arcId).toBe("NEW-FOLDER");
      expect(result[0].id).toBeDefined();
      expect(result[0].created_at).toBeInstanceOf(Date);

      // Verify it can be found
      const found = await repository.findByArcId("NEW-FOLDER");
      expect(found).not.toBeNull();
    });

    it("should enforce unique constraint on arcId", async () => {
      await expect(
        repository.create({
          arcId: "12345678-90ab-cdef-1234-567890abcdef", // This already exists
          folderData: {
            data: { items: [], rootID: "root", root: "root" },
            shareID: "share",
            author: "Author",
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("integration", () => {
    it("should handle complete CRUD lifecycle", async () => {
      const arcId = "LIFECYCLE-TEST";

      // CREATE
      const createData = {
        arcId,
        folderData: {
          data: { items: [], rootID: "root", root: "root" },
          shareID: "share",
          author: "Author",
        },
      };
      const created = await repository.create(createData);
      expect(created[0].arcId).toBe(arcId);

      // READ by arcId
      const foundByArcId = await repository.findByArcId(arcId);
      expect(foundByArcId).not.toBeNull();

      // READ by id
      const foundById = await repository.findById(created[0].id);
      expect(foundById).toEqual(foundByArcId);

      // DELETE
      const deleted = await repository.deleteById(created[0].id);
      expect(deleted).toBe(true);

      // Verify deletion
      const notFound = await repository.findById(created[0].id);
      expect(notFound).toBeNull();
    });
  });
});
