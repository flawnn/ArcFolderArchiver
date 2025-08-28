import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { ArcFolder } from "../../external/models/arc";

// Mock the dependencies at module level for easy spying
mock.module("../../external/arc.client", () => ({
  arcClient: {
    extractFolderData: mock(),
  },
}));

mock.module("./archive.repository", () => ({
  archiveRepository: {
    findByArcId: mock(),
    findById: mock(),
    deleteById: mock(),
    create: mock(),
  },
}));

// Import AFTER mocking
const { arcClient } = await import("../../external/arc.client");
const { archiveRepository } = await import("./archive.repository");
const { archiveService } = await import("./archive.service");

describe("ArchiveService - Mocked Dependencies", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(archiveRepository).forEach((mockFn: any) =>
      mockFn.mockReset?.(),
    );
    Object.values(arcClient).forEach((mockFn: any) => mockFn.mockReset?.());
  });

  afterEach(() => {
    // Clean up mocks after each test
    Object.values(archiveRepository).forEach((mockFn: any) =>
      mockFn.mockRestore?.(),
    );
    Object.values(arcClient).forEach((mockFn: any) => mockFn.mockRestore?.());
  });

  describe("getOrCreateFolder", () => {
    const validUrl = "https://arc.net/folder/123ABC";
    const deleteInDays = 30;

    it("should return existing folder when URL already exists in database (happy path - get)", async () => {
      // Arrange: Mock existing folder in database
      const existingFolder = {
        id: "folder-123",
        arcId: "123ABC",
        folderData: { name: "Existing Folder", tabs: [] },
        createdAt: new Date(),
        lastFetchedAt: new Date(),
      };

      // Use the mocked methods directly (no spyOn needed with module mocks)
      (archiveRepository.findByArcId as any).mockResolvedValue(existingFolder);

      // Act
      const result = await archiveService.getOrCreateFolder(
        validUrl,
        deleteInDays,
      );

      // Assert
      expect(archiveRepository.findByArcId).toHaveBeenCalledWith("123ABC"); // Extract ID from URL
      expect(arcClient.extractFolderData).not.toHaveBeenCalled(); // Should not fetch from external
      expect(archiveRepository.create).not.toHaveBeenCalled(); // Should not create new

      expect(result).toEqual(existingFolder);
    });

    it("should create new folder when URL does not exist (happy path - create)", async () => {
      // Arrange: Mock database returns null (no existing folder)
      const extractedData: ArcFolder = {
        data: {
          items: [
            {
              id: "123e4567-e89b-12d3-a456-426614174000",
              parentID: "123e4567-e89b-12d3-a456-426614174001",
              childrenIds: [],
              title: "Example Tab",
              createdAt: 1640995200000,
              data: {
                tab: {
                  timeLastActiveAt: 1640995200000,
                  savedMuteStatus: "false",
                  savedURL: "https://example.com",
                  savedTitle: "Example",
                },
              },
            },
          ],
          rootID: "123e4567-e89b-12d3-a456-426614174001",
          root: "123e4567-e89b-12d3-a456-426614174001",
        },
        shareID: "123e4567-e89b-12d3-a456-426614174003",
        author: "Test Author",
      };
      const newFolder = [
        {
          id: "new-folder-id",
          arcId: "123ABC",
          folderData: extractedData,
          deleteAt: expect.any(Date),
          createdAt: expect.any(Date),
          lastFetchedAt: expect.any(Date),
        },
      ];

      (archiveRepository.findByArcId as any).mockResolvedValue(null); // No existing folder
      (arcClient.extractFolderData as any).mockResolvedValue(extractedData);
      (archiveRepository.create as any).mockResolvedValue(newFolder);

      // Act
      const result = await archiveService.getOrCreateFolder(
        validUrl,
        deleteInDays,
      );

      // Assert
      expect(archiveRepository.findByArcId).toHaveBeenCalledWith("123ABC");
      expect(arcClient.extractFolderData).toHaveBeenCalledWith(validUrl);
      expect(archiveRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          arcId: "123ABC",
          folderData: extractedData,
        }),
      );

      expect(result).toEqual(newFolder[0]);
    });

    it("should handle ArcClient errors gracefully", async () => {
      // Arrange: Mock repository returns null, ArcClient throws error
      (archiveRepository.findByArcId as any).mockResolvedValue(null);
      (arcClient.extractFolderData as any).mockRejectedValue(
        new Error("Failed to fetch Arc data"),
      );

      // Act & Assert
      await expect(
        archiveService.getOrCreateFolder(validUrl, deleteInDays),
      ).rejects.toThrow();

      // Verify that create was not called
      expect(archiveRepository.create).not.toHaveBeenCalled();
    });

    it("should handle repository create errors gracefully", async () => {
      // Arrange: ArcClient succeeds, but repository create fails
      const extractedData: ArcFolder = {
        data: {
          items: [],
          rootID: "123e4567-e89b-12d3-a456-426614174001",
          root: "123e4567-e89b-12d3-a456-426614174001",
        },
        shareID: "123e4567-e89b-12d3-a456-426614174003",
        author: "Test Author",
      };

      (archiveRepository.findByArcId as any).mockResolvedValue(null);
      (arcClient.extractFolderData as any).mockResolvedValue(extractedData);
      (archiveRepository.create as any).mockRejectedValue(
        new Error("Database error"),
      );

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

    it("should handle null return from ArcClient", async () => {
      // Arrange: ArcClient returns null (e.g., when folder is not found or malformed)
      (archiveRepository.findByArcId as any).mockResolvedValue(null);
      (arcClient.extractFolderData as any).mockResolvedValue(null);

      // Act & Assert
      await expect(
        archiveService.getOrCreateFolder(validUrl, deleteInDays),
      ).rejects.toThrow();

      // Verify that create was not called
      expect(archiveRepository.create).not.toHaveBeenCalled();
    });

    it("should calculate correct deleteAt timestamp", async () => {
      // Arrange
      const extractedData: ArcFolder = {
        data: {
          items: [],
          rootID: "123e4567-e89b-12d3-a456-426614174001",
          root: "123e4567-e89b-12d3-a456-426614174001",
        },
        shareID: "123e4567-e89b-12d3-a456-426614174003",
        author: "Test Author",
      };
      const currentTime = Date.now();

      (archiveRepository.findByArcId as any).mockResolvedValue(null);
      (arcClient.extractFolderData as any).mockResolvedValue(extractedData);
      (archiveRepository.create as any).mockResolvedValue([{}]);

      // Act
      await archiveService.getOrCreateFolder(validUrl, deleteInDays);

      // Assert
      expect(archiveRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteAt: expect.any(Date),
        }),
      );

      // Verify the deleteAt is approximately correct (within 1 minute)
      const createCall = (archiveRepository.create as any).mock.calls[0][0];
      if (createCall?.deleteAt) {
        const deleteAt = createCall.deleteAt;
        const expectedDeleteTime =
          currentTime + deleteInDays * 24 * 60 * 60 * 1000;
        const timeDifference = Math.abs(
          deleteAt.getTime() - expectedDeleteTime,
        );
        expect(timeDifference).toBeLessThan(60000);
      }
    });
  });

  describe("deleteFolder", () => {
    const validId = "folder-123";
    const nonExistentId = "folder-NONEXISTENT";

    it("should delete folder successfully when it exists", async () => {
      // Arrange
      (archiveRepository.deleteById as any).mockResolvedValue(true);

      // Act
      const result = await archiveService.deleteFolder(validId);

      // Assert
      expect(archiveRepository.deleteById).toHaveBeenCalledWith(validId);
      expect(result).toBe(true);
    });

    it("should return false when folder does not exist", async () => {
      // Arrange
      (archiveRepository.deleteById as any).mockResolvedValue(false);

      // Act
      const result = await archiveService.deleteFolder(nonExistentId);

      // Assert
      expect(archiveRepository.deleteById).toHaveBeenCalledWith(nonExistentId);
      expect(result).toBe(false);
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange
      (archiveRepository.deleteById as any).mockRejectedValue(
        new Error("Database error"),
      );

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
