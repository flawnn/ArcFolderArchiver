import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";

// 1. Create a comprehensive mock of the Drizzle db object and its fluent API
const mockDb = {
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  limit: mock().mockResolvedValue([]), // The end of a select chain
  insert: mock().mockReturnThis(),
  values: mock().mockReturnThis(),
  returning: mock().mockResolvedValue([]), // The end of an insert chain
  delete: mock().mockReturnThis(),
  // Drizzle's delete in node-postgres returns a result object with rowCount
  // We mock the promise resolution which is the end of the chain.
  then: mock(),
};

// 2. Mock the entire module that exports the 'db' instance
mock.module("../../db", () => ({
  db: mockDb,
}));

// 3. Dynamically import the repository AFTER the mock is set up
const { archiveRepository } = await import("./archive.repository");

describe("ArchiveRepository", () => {
  beforeEach(() => {
    // Reset the state of all mocks before each test
    for (const key in mockDb) {
      // @ts-ignore
      mockDb[key].mockClear();
    }
    // Reset the `then` mock which is used for deletes
    mockDb.then.mockClear();
  });

  afterEach(() => {
    // Clean up test database or restore mocks
  });

  describe("findByUrl", () => {
    const validUrl = "https://arc.net/folder/123ABC";
    const nonExistentUrl = "https://arc.net/folder/NONEXISTENT";

    it("should return folder when URL exists in database", async () => {
      // Arrange: Setup mock to return existing folder
      const expectedFolder = {
        id: "folder-123",
        arcUrl: validUrl,
        folderData: { name: "Test Folder", tabs: [] },
        createdAt: new Date(),
        lastFetchedAt: new Date(),
      };

      // TODO: When implementing, mock your Drizzle DB calls here
      // Mock the final step of the chain to return our expected folder
      mockDb.limit.mockResolvedValueOnce([expectedFolder]);

      // Act
      const result = await archiveRepository.findByUrl(validUrl);

      // Assert
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(schema.archivedFolders);
      expect(mockDb.where).toHaveBeenCalledWith(
        eq(schema.archivedFolders.arcId, validUrl),
      );
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedFolder);
    });

    it("should return null when URL does not exist in database", async () => {
      // Arrange: Setup mock to return empty result
      mockDb.limit.mockResolvedValueOnce([]);

      // Act
      const result = await archiveRepository.findByUrl(nonExistentUrl);

      // Assert
      expect(result).toBeNull();
    });

    it("should handle invalid URL format gracefully", async () => {
      // Act
      const result = await archiveRepository.findByUrl("invalid-url");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle empty or null URL", async () => {
      // Act & Assert
      const emptyResult = await archiveRepository.findByUrl("");
      const nullResult = await archiveRepository.findByUrl(null as any);

      expect(emptyResult).toBeNull();
      expect(nullResult).toBeNull();
    });
  });

  describe("findById", () => {
    const validId = "folder-123";
    const nonExistentId = "folder-NONEXISTENT";

    it("should return folder when ID exists in database", async () => {
      // Arrange
      const expectedFolder = {
        id: validId,
        arcUrl: "https://arc.net/folder/123ABC",
        folderData: { name: "Test Folder", tabs: [] },
        createdAt: new Date(),
        lastFetchedAt: new Date(),
      };

      // TODO: Mock database query
      mockDb.limit.mockResolvedValueOnce([expectedFolder]);

      // Act
      const result = await archiveRepository.findById(validId);

      // Assert
      expect(mockDb.where).toHaveBeenCalledWith(
        eq(schema.archivedFolders.id, validId),
      );
      expect(result).toEqual(expectedFolder);
    });

    it("should return null when ID does not exist", async () => {
      // Act
      const result = await archiveRepository.findById(nonExistentId);

      // Assert
      expect(result).toBeNull();
    });

    it("should handle invalid ID format", async () => {
      // Test with various invalid ID formats
      const invalidIds = ["", "  ", "invalid-format", "123"];

      for (const invalidId of invalidIds) {
        const result = await archiveRepository.findById(invalidId);
        expect(result).toBeNull();
      }
    });
  });

  describe("deleteById", () => {
    const validId = "folder-123";
    const nonExistentId = "folder-NONEXISTENT";

    it("should return true when folder exists and is deleted successfully", async () => {
      // Mock a successful deletion (rowCount > 0)
      // For node-postgres, the delete query resolves to a result object
      mockDb.then.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      const result = await archiveRepository.deleteById(validId);

      // Assert
      expect(mockDb.delete).toHaveBeenCalledWith(schema.archivedFolders);
      expect(mockDb.where).toHaveBeenCalledWith(
        eq(schema.archivedFolders.id, validId),
      );
      expect(result).toBe(true);
    });

    it("should return false when folder does not exist", async () => {
      // Mock a failed deletion (rowCount === 0)
      mockDb.then.mockResolvedValueOnce({ rowCount: 0 });

      // Act
      const result = await archiveRepository.deleteById(nonExistentId);

      // Assert
      expect(result).toBe(false);
    });

    it("should handle invalid ID format gracefully", async () => {
      // Act
      const result = await archiveRepository.deleteById("invalid-id");

      // Assert
      expect(result).toBe(false);
    });

    it("should handle database errors gracefully", async () => {
      // Mock the promise being rejected
      mockDb.then.mockRejectedValueOnce(new Error("DB Connection Error"));

      // For now, test that it returns false on error
      const result = await archiveRepository.deleteById(validId);
      expect(result).toBe(false);
    });
  });

  describe("create", () => {
    const validFolderData = {
      id: "folder-123",
      arcUrl: "https://arc.net/folder/123ABC",
      folderData: {
        name: "Test Folder",
        tabs: [{ url: "https://example.com", title: "Example" }],
      },
      deleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    it("should create folder successfully and return the created folder", async () => {
      // Mock the 'returning' step to give back the created folder
      mockDb.returning.mockResolvedValueOnce([validFolderData]);

      // Act
      const result = await archiveRepository.create(validFolderData);

      // Assert
      expect(mockDb.insert).toHaveBeenCalledWith(schema.archivedFolders);
      expect(mockDb.values).toHaveBeenCalledWith(validFolderData);
      expect(mockDb.returning).toHaveBeenCalled();
      expect(result).toEqual(validFolderData);
    });

    it("should throw error when trying to create folder with duplicate URL", async () => {
      // Mock the database driver throwing a unique constraint violation error
      mockDb.returning.mockRejectedValueOnce(
        new Error("UNIQUE constraint failed"),
      );

      // This should fail until the method throws an error on duplicate entry.
      await expect(archiveRepository.create(validFolderData)).rejects.toThrow(
        "UNIQUE constraint failed",
      );
    });

    it("should handle missing required fields", async () => {
      // Test with incomplete data
      const incompleteData = {
        // Missing required fields like arcUrl
        folderData: { name: "Test" },
      };

      // This test is now more relevant for the service layer, which prepares the data.
      // The repository should ideally receive valid data.
      // If it receives invalid data, Drizzle/DB will throw an error.
      mockDb.returning.mockRejectedValueOnce(
        new Error("Missing required fields"),
      );

      // Act & Assert
      // This should fail until the method validates input and throws an error.
      await expect(archiveRepository.create(incompleteData)).rejects.toThrow();
    });

    it("should validate field types and formats", async () => {
      // Test with invalid data types
      const invalidData = {
        id: 123, // Should be string
        arcUrl: "invalid-url",
        folderData: "not-an-object", // Should be object
        deleteAt: "not-a-date", // Should be Date
      };

      // This is also better tested at the service/controller layer with Zod.
      // The repository assumes it gets correctly typed data.
      // We'll test that the repository throws if the DB rejects the data.
      mockDb.returning.mockRejectedValueOnce(new Error("Invalid data type"));

      // Assert
      // This should fail until the method validates input and throws an error.
      await expect(archiveRepository.create(invalidData)).rejects.toThrow();
    });

    it("should handle very large folder data", async () => {
      // Test with folder containing many tabs
      const largeFolderData = {
        ...validFolderData,
        folderData: {
          name: "Large Folder",
          tabs: Array.from({ length: 1000 }, (_, i) => ({
            url: `https://example${i}.com`,
            title: `Tab ${i}`,
          })),
        },
      };

      // Mock the successful creation of the large folder data
      mockDb.returning.mockResolvedValueOnce([largeFolderData]);

      // Act
      const result = await archiveRepository.create(largeFolderData);

      // Assert
      expect(result).toEqual(largeFolderData);
    });
  });
});
