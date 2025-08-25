import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { Hono } from "hono";
import { z } from "zod";
import { archiveController } from "./archive.controller";
import { archiveService } from "./archive.service";

// Create a test Hono app with our controller routes
const testApp = new Hono();
testApp.post(
  "/api/archive",
  archiveController.postFolder.bind(archiveController),
);
testApp.delete(
  "/api/archive/:id",
  archiveController.deleteFolder.bind(archiveController),
);

// Schema for request validation (you'll want to add Zod to the project)
const createFolderSchema = z.object({
  url: z.string().url("Invalid URL format"),
  deleteIn: z.number().int().min(1).max(365).optional().default(30),
});

describe("ArchiveController", () => {
  beforeEach(() => {
    // Reset mocks before each test
  });

  afterEach(() => {
    // Clean up after each test
  });

  describe("POST /api/archive (postFolder)", () => {
    const validRequestBody = {
      url: "https://arc.net/folder/123ABC",
      deleteIn: 30,
    };

    it("should return folder ID when folder exists in database", async () => {
      // Arrange: Mock service to return existing folder
      const existingFolder = {
        id: "folder-123",
        arcUrl: validRequestBody.url,
        folderData: { name: "Test Folder", tabs: [] },
      };

      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockResolvedValue(existingFolder);

      // Act
      const response = await testApp.fetch(
        new Request("http://localhost/api/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validRequestBody),
        }),
      );

      // Assert
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        id: existingFolder.id,
        message: expect.any(String),
      });
      expect(getOrCreateFolderSpy).toHaveBeenCalledWith(
        validRequestBody.url,
        validRequestBody.deleteIn,
      );
    });

    it("should create new folder when URL does not exist", async () => {
      // Arrange: Mock service to return new folder
      const newFolder = {
        id: "folder-456",
        arcUrl: validRequestBody.url,
        folderData: { name: "New Folder", tabs: [] },
      };

      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockResolvedValue(newFolder);

      // Act
      const response = await testApp.fetch(
        new Request("http://localhost/api/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validRequestBody),
        }),
      );

      // Assert
      expect(response.status).toBe(201);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        id: newFolder.id,
        message: expect.any(String),
      });
    });

    it("should return 400 when request body is malformed JSON", async () => {
      // Act
      const response = await testApp.fetch(
        new Request("http://localhost/api/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{ invalid json",
        }),
      );

      // Assert
      expect(response.status).toBe(400);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        error: expect.stringContaining("Invalid JSON"),
      });
    });

    it("should validate URL field using Zod schema", async () => {
      // Test cases for URL validation
      const invalidUrlCases = [
        { url: undefined, deleteIn: 30 }, // Missing URL
        { url: null, deleteIn: 30 }, // Null URL
        { url: "", deleteIn: 30 }, // Empty URL
        { url: "not-a-url", deleteIn: 30 }, // Invalid URL format
        { url: "http://google.com", deleteIn: 30 }, // Valid URL but not Arc
      ];

      for (const invalidCase of invalidUrlCases) {
        const response = await testApp.fetch(
          new Request("http://localhost/api/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(invalidCase),
          }),
        );

        expect(response.status).toBe(400);
        const responseJson = await response.json();
        expect(responseJson).toEqual({
          error: expect.stringContaining("URL"),
        });
      }
    });

    it("should validate deleteIn field using Zod schema", async () => {
      // Test cases for deleteIn validation
      const invalidDeleteInCases = [
        { url: validRequestBody.url, deleteIn: "30" }, // String instead of number
        { url: validRequestBody.url, deleteIn: -1 }, // Negative number
        { url: validRequestBody.url, deleteIn: 0 }, // Zero
        { url: validRequestBody.url, deleteIn: 366 }, // Too large
        { url: validRequestBody.url, deleteIn: 3.5 }, // Float instead of integer
      ];

      for (const invalidCase of invalidDeleteInCases) {
        const response = await testApp.fetch(
          new Request("http://localhost/api/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(invalidCase),
          }),
        );

        expect(response.status).toBe(400);
        const responseJson = await response.json();
        expect(responseJson).toEqual({
          error: expect.stringContaining("deleteIn"),
        });
      }
    });

    it("should use default deleteIn value when not provided", async () => {
      // Arrange
      const requestWithoutDeleteIn = { url: validRequestBody.url };
      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockResolvedValue({ id: "folder-123" } as any);

      // Act
      const response = await testApp.fetch(
        new Request("http://localhost/api/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestWithoutDeleteIn),
        }),
      );

      // Assert
      expect(getOrCreateFolderSpy).toHaveBeenCalledWith(
        validRequestBody.url,
        30,
      ); // Default value
    });

    it("should return 500 when service throws an error", async () => {
      // Arrange: Mock service to throw error
      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockRejectedValue(new Error("Service error"));

      // Act
      const response = await testApp.fetch(
        new Request("http://localhost/api/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validRequestBody),
        }),
      );

      // Assert
      expect(response.status).toBe(500);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        error: "An unexpected error occurred",
      });
    });

    it("should handle different Arc URL formats", async () => {
      // Test various valid Arc URL formats
      const validArcUrls = [
        "https://arc.net/folder/ABC123",
        "https://arc.net/folder/abc123def456",
        "https://arc.net/folder/123-ABC-456",
      ];

      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockResolvedValue({ id: "folder-123" } as any);

      for (const arcUrl of validArcUrls) {
        const response = await testApp.fetch(
          new Request("http://localhost/api/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: arcUrl, deleteIn: 30 }),
          }),
        );

        expect(response.status).toBe(200);
      }
    });
  });

  describe("DELETE /api/archive/:id (deleteFolder)", () => {
    const validFolderId = "folder-123";

    it("should delete folder successfully when it exists", async () => {
      // Arrange: Mock service to return true (successful deletion)
      const deleteFolderSpy = spyOn(archiveService, "deleteFolder");
      deleteFolderSpy.mockResolvedValue(true);

      // Act
      const response = await testApp.fetch(
        new Request(`http://localhost/api/archive/${validFolderId}`, {
          method: "DELETE",
        }),
      );

      // Assert
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        message: "Folder deleted successfully",
      });
      expect(deleteFolderSpy).toHaveBeenCalledWith(validFolderId);
    });

    it("should return 404 when folder does not exist", async () => {
      // Arrange: Mock service to return false (folder not found)
      const deleteFolderSpy = spyOn(archiveService, "deleteFolder");
      deleteFolderSpy.mockResolvedValue(false);

      // Act
      const response = await testApp.fetch(
        new Request(`http://localhost/api/archive/nonexistent`, {
          method: "DELETE",
        }),
      );

      // Assert
      expect(response.status).toBe(404);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        error: "Folder not found",
      });
    });

    it("should validate folder ID format", async () => {
      // Test invalid folder ID formats
      const invalidIds = [
        "", // Empty
        "   ", // Whitespace
        "123", // Too short
        "not-a-uuid", // Invalid format
      ];

      for (const invalidId of invalidIds) {
        const response = await testApp.fetch(
          new Request(`http://localhost/api/archive/${invalidId}`, {
            method: "DELETE",
          }),
        );

        expect(response.status).toBe(400);
        const responseJson = await response.json();
        expect(responseJson).toEqual({
          error: expect.stringContaining("Invalid folder ID"),
        });
      }
    });

    it("should return 500 when service throws an error", async () => {
      // Arrange: Mock service to throw error
      const deleteFolderSpy = spyOn(archiveService, "deleteFolder");
      deleteFolderSpy.mockRejectedValue(new Error("Service error"));

      // Act
      const response = await testApp.fetch(
        new Request(`http://localhost/api/archive/${validFolderId}`, {
          method: "DELETE",
        }),
      );

      // Assert
      expect(response.status).toBe(500);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        error: "An unexpected error occurred",
      });
    });
  });
});
