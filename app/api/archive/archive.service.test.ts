import { describe, expect, it, mock } from "bun:test";
import type { ArcFolder } from "../../external/models/arc";
import { ArchiveService } from "./archive.service";

// Mock the dependencies at module level for easy spying
mock.module("../../external/arc.client", () => ({
  arcClient: {
    extractFolderData: mock(),
  },
}));

const mockRepository = {
  findByArcId: mock(),
  findById: mock(),
  deleteById: mock(),
  create: mock(),
};

mock.module("./archive.repository", () => ({
  ArchiveRepository: mock(() => mockRepository),
}));

// Import AFTER mocking
const { arcClient } = await import("../../external/arc-client");

describe("ArchiveService - Mocked Dependencies", () => {
  const archiveService = new ArchiveService();

  describe("getOrCreateFolder", () => {
    const validUrl = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const deleteInDays = 30;

    it("should return existing folder when URL already exists in database (happy path - get)", async () => {
      // Arrange: Mock existing folder in database
      const existingFolder = {
        id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        arcId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        folderData: { name: "Existing Folder", tabs: [] },
        createdAt: new Date(),
        lastFetchedAt: new Date(),
      };

      // Use the mocked methods directly
      mockRepository.findByArcId.mockResolvedValue(existingFolder);

      // Act
      const result = await archiveService.getOrCreateFolder(
        validUrl,
        deleteInDays,
      );

      // Assert
      expect(mockRepository.findByArcId).toHaveBeenCalledWith(
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      ); // Extract ID from URL
      expect(arcClient.extractFolderData).not.toHaveBeenCalled(); // Should not fetch from external
      expect(mockRepository.create).not.toHaveBeenCalled(); // Should not create new

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
          arcId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          folderData: extractedData,
          deleteAt: expect.any(Date),
          createdAt: expect.any(Date),
          lastFetchedAt: expect.any(Date),
        },
      ];

      mockRepository.findByArcId.mockResolvedValue(null); // No existing folder
      (arcClient.extractFolderData as any).mockResolvedValue(extractedData);
      mockRepository.create.mockResolvedValue(newFolder);

      // Act
      const result = await archiveService.getOrCreateFolder(
        validUrl,
        deleteInDays,
      );

      // Assert
      expect(mockRepository.findByArcId).toHaveBeenCalledWith(
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      );
      expect(arcClient.extractFolderData).toHaveBeenCalledWith(validUrl);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          arcId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          folderData: extractedData,
        }),
      );

      expect(result).toEqual(newFolder[0]);
    });

    it("should handle ArcClient errors gracefully", async () => {
      mockRepository.create.mockReset();

      // Arrange: Mock repository returns null, ArcClient throws error
      mockRepository.findByArcId.mockResolvedValue(null);
      (arcClient.extractFolderData as any).mockRejectedValue(
        new Error("Failed to fetch Arc data"),
      );

      // Act & Assert
      await expect(
        archiveService.getOrCreateFolder(validUrl, deleteInDays),
      ).rejects.toThrow();

      // Verify that create was not called
      expect(mockRepository.create).not.toHaveBeenCalled();
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

      mockRepository.findByArcId.mockResolvedValue(null);
      (arcClient.extractFolderData as any).mockResolvedValue(extractedData);
      mockRepository.create.mockRejectedValue(new Error("Database error"));

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
      mockRepository.create.mockReset();

      // Arrange: ArcClient returns null (e.g., when folder is not found or malformed)
      mockRepository.findByArcId.mockResolvedValue(null);
      (arcClient.extractFolderData as any).mockResolvedValue(null);

      // Act & Assert
      await expect(
        archiveService.getOrCreateFolder(validUrl, deleteInDays),
      ).rejects.toThrow();

      // Verify that create was not called
      expect(mockRepository.create).not.toHaveBeenCalled();
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

      mockRepository.findByArcId.mockResolvedValue(null);
      (arcClient.extractFolderData as any).mockResolvedValue(extractedData);
      mockRepository.create.mockResolvedValue([{}]);

      // Act
      await archiveService.getOrCreateFolder(validUrl, deleteInDays);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteAt: expect.any(Date),
        }),
      );

      // Verify the deleteAt is approximately correct (within 1 minute)
      const createCall = mockRepository.create.mock.calls[0][0];
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
    const validId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const nonExistentId = "9f8e7d6c-5b4a-3928-1716-050392817465";

    it("should delete folder successfully when it exists", async () => {
      // Arrange
      mockRepository.deleteById.mockResolvedValue(true);

      // Act
      const result = await archiveService.deleteFolder(validId);

      // Assert
      expect(mockRepository.deleteById).toHaveBeenCalledWith(validId);
      expect(result).toBe(true);
    });

    it("should return false when folder does not exist", async () => {
      // Arrange
      mockRepository.deleteById.mockResolvedValue(false);

      // Act
      const result = await archiveService.deleteFolder(nonExistentId);

      // Assert
      expect(mockRepository.deleteById).toHaveBeenCalledWith(nonExistentId);
      expect(result).toBe(false);
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange
      mockRepository.deleteById.mockRejectedValue(new Error("Database error"));

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
