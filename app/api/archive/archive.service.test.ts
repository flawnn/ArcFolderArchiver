import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import { arcClient } from "../../external/arc.client";
import { archiveRepository } from "./archive.repository";
import { archiveService } from "./archive.service";

// Mock the dependencies
const mockRepository = {
  findByUrl: mock(),
  findById: mock(),
  deleteById: mock(),
  create: mock(),
};

const mockArcClient = {
  extractFolderData: mock(),
};

describe("ArchiveService", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(mockRepository).forEach((mockFn) => mockFn.mockReset());
    Object.values(mockArcClient).forEach((mockFn) => mockFn.mockReset());
  });

  afterEach(() => {
    // Restore mocks after each test
    Object.values(mockRepository).forEach((mockFn) => mockFn.mockRestore?.());
    Object.values(mockArcClient).forEach((mockFn) => mockFn.mockRestore?.());
  });

  describe("getOrCreateFolder", () => {
    const validUrl = "https://arc.net/folder/123ABC";
    const deleteInDays = 30;

    it("should return existing folder when URL already exists in database (happy path - get)", async () => {
      // Arrange: Mock existing folder in database
      const existingFolder = {
        id: "folder-123",
        arcUrl: validUrl,
        folderData: { name: "Existing Folder", tabs: [] },
        createdAt: new Date(),
        lastFetchedAt: new Date(),
      };

      // Spy on repository methods to verify calls
      const findByUrlSpy = spyOn(archiveRepository, "findByUrl");
      const extractDataSpy = spyOn(arcClient, "extractFolderData");
      const createSpy = spyOn(archiveRepository, "create");

      findByUrlSpy.mockResolvedValue(existingFolder);

      // Act
      const result = await archiveService.getOrCreateFolder(
        validUrl,
        deleteInDays,
      );

      // Assert
      expect(findByUrlSpy).toHaveBeenCalledWith(validUrl);
      expect(extractDataSpy).not.toHaveBeenCalled(); // Should not fetch from external
      expect(createSpy).not.toHaveBeenCalled(); // Should not create new

      expect(result).toEqual(existingFolder);
    });

    it("should create new folder when URL does not exist (happy path - create)", async () => {
      // Arrange: Mock database returns null (no existing folder)
      const extractedData = {
        name: "New Folder",
        tabs: [{ url: "https://example.com", title: "Example" }],
      };
      const newFolder = {
        id: expect.any(String),
        arcUrl: validUrl,
        folderData: extractedData,
        deleteAt: expect.any(Date),
      };

      const findByUrlSpy = spyOn(archiveRepository, "findByUrl");
      const extractDataSpy = spyOn(arcClient, "extractFolderData");
      const createSpy = spyOn(archiveRepository, "create");

      findByUrlSpy.mockResolvedValue(null); // No existing folder
      extractDataSpy.mockResolvedValue(extractedData);
      createSpy.mockResolvedValue(newFolder);

      // Act
      const result = await archiveService.getOrCreateFolder(
        validUrl,
        deleteInDays,
      );

      // Assert
      expect(findByUrlSpy).toHaveBeenCalledWith(validUrl);
      expect(extractDataSpy).toHaveBeenCalledWith(validUrl);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          arcUrl: validUrl,
          folderData: extractedData,
        }),
      );

      expect(result).toEqual(newFolder);
    });

    it("should handle ArcClient errors gracefully", async () => {
      // Arrange: Mock repository returns null, ArcClient throws error
      const findByUrlSpy = spyOn(archiveRepository, "findByUrl");
      const extractDataSpy = spyOn(arcClient, "extractFolderData");
      const createSpy = spyOn(archiveRepository, "create");

      findByUrlSpy.mockResolvedValue(null);
      extractDataSpy.mockRejectedValue(new Error("Failed to fetch Arc data"));

      // Act & Assert
      await expect(
        archiveService.getOrCreateFolder(validUrl, deleteInDays),
      ).rejects.toThrow();

      // Verify that create was not called
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("should handle repository create errors gracefully", async () => {
      // Arrange: ArcClient succeeds, but repository create fails
      const extractedData = { name: "New Folder", tabs: [] };

      const findByUrlSpy = spyOn(archiveRepository, "findByUrl");
      const extractDataSpy = spyOn(arcClient, "extractFolderData");
      const createSpy = spyOn(archiveRepository, "create");

      findByUrlSpy.mockResolvedValue(null);
      extractDataSpy.mockResolvedValue(extractedData);
      createSpy.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(
        archiveService.getOrCreateFolder(validUrl, deleteInDays),
      ).rejects.toThrow();
    });

    it("should validate input parameters", async () => {
      // Test invalid URL
      await expect(
        archiveService.getOrCreateFolder("", deleteInDays),
      ).rejects.toThrow();
      await expect(
        archiveService.getOrCreateFolder("invalid-url", deleteInDays),
      ).rejects.toThrow();

      // Test invalid deleteInDays
      await expect(
        archiveService.getOrCreateFolder(validUrl, -1),
      ).rejects.toThrow();
      await expect(
        archiveService.getOrCreateFolder(validUrl, 0),
      ).rejects.toThrow();
    });

    it("should calculate correct deleteAt timestamp", async () => {
      // Arrange
      const extractedData = { name: "Test Folder", tabs: [] };
      const currentTime = Date.now();

      const findByUrlSpy = spyOn(archiveRepository, "findByUrl");
      const extractDataSpy = spyOn(arcClient, "extractFolderData");
      const createSpy = spyOn(archiveRepository, "create");

      findByUrlSpy.mockResolvedValue(null);
      extractDataSpy.mockResolvedValue(extractedData);
      createSpy.mockResolvedValue({});

      // Act
      await archiveService.getOrCreateFolder(validUrl, deleteInDays);

      // Assert
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteAt: expect.any(Date),
        }),
      );

      // Verify the deleteAt is approximately correct (within 1 minute)
      if (createSpy.mock.calls.length > 0) {
        const deleteAt = createSpy.mock.calls[0][0].deleteAt;
        const expectedDeleteTime =
          currentTime + deleteInDays * 24 * 60 * 60 * 1000;
        const timeDifference = Math.abs(
          deleteAt.getTime() - expectedDeleteTime,
        );
        expect(timeDifference).toBeLessThan(60000); // Within 1 minute
      }
    });
  });

  describe("deleteFolder", () => {
    const validId = "folder-123";
    const nonExistentId = "folder-NONEXISTENT";

    it("should delete folder successfully when it exists", async () => {
      // Arrange
      const deleteByIdSpy = spyOn(archiveRepository, "deleteById");
      deleteByIdSpy.mockResolvedValue(true);

      // Act
      const result = await archiveService.deleteFolder(validId);

      // Assert
      expect(deleteByIdSpy).toHaveBeenCalledWith(validId);

      expect(result).toBe(true);
    });

    it("should return false when folder does not exist", async () => {
      // Arrange
      const deleteByIdSpy = spyOn(archiveRepository, "deleteById");
      deleteByIdSpy.mockResolvedValue(false);

      // Act
      const result = await archiveService.deleteFolder(nonExistentId);

      // Assert
      expect(deleteByIdSpy).toHaveBeenCalledWith(nonExistentId);
      expect(result).toBe(false);
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange
      const deleteByIdSpy = spyOn(archiveRepository, "deleteById");
      deleteByIdSpy.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(archiveService.deleteFolder(validId)).rejects.toThrow();
    });

    it("should validate input parameters", async () => {
      // Test invalid IDs
      await expect(archiveService.deleteFolder("")).rejects.toThrow();
      await expect(archiveService.deleteFolder("  ")).rejects.toThrow();
      await expect(archiveService.deleteFolder(null as any)).rejects.toThrow();
      await expect(
        archiveService.deleteFolder(undefined as any),
      ).rejects.toThrow();
    });

    it("should handle UUID format validation", async () => {
      // Test various invalid UUID formats
      const invalidIds = [
        "123",
        "not-a-uuid",
        "123e4567-e89b-12d3-a456", // Too short
        "123e4567-e89b-12d3-a456-426614174000-extra", // Too long
      ];

      for (const invalidId of invalidIds) {
        await expect(archiveService.deleteFolder(invalidId)).rejects.toThrow();
      }
    });
  });
});
