import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import type { ArchivedFolder } from "~/db/schema";
import type { ArcFolder } from "~/external/models/arc";
import { setupHonoServer } from "~/hono";
import {
  type DELETEFolderRequest,
  type POSTFolderRequest,
} from "../models/archive";
import { archiveService } from "./archive.service";

describe("ArchiveController", () => {
  let app: ReturnType<typeof setupHonoServer>;

  beforeEach(() => {
    app = setupHonoServer();
  });

  afterEach(() => {
    // Clean up mocks after each test
  });

  // [AI] Helper function to create mock ArchivedFolder objects
  const createMockArchivedFolder = (
    overrides: Partial<ArchivedFolder> = {},
  ): ArchivedFolder => {
    const mockFolderData: ArcFolder = {
      data: {
        items: [],
        root: "mock-root-id",
        rootID: "mock-root-id",
      },
      shareID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      author: "Test Author",
    };

    return {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      arcId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      folderData: mockFolderData,
      lastFetchedAt: new Date(),
      deleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      ...overrides,
    };
  };

  describe("POST /api/archive (postFolder)", () => {
    const validRequestBody: POSTFolderRequest = {
      arcId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      deleteInDays: 30,
      jsonOnly: false
    };

    it("should return folder ID when folder exists in database", async () => {
      // Arrange: Mock service to return existing folder
      const existingFolder = createMockArchivedFolder({
        arcId: validRequestBody.arcId,
      });

      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockResolvedValue(existingFolder);

      // Act - Using app.request() method (Hono best practice)
      const response = await app.request("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRequestBody),
      });

      // Assert
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        internalUUID: existingFolder.id,
      });
      expect(getOrCreateFolderSpy).toHaveBeenCalledWith(
        validRequestBody.arcId,
        validRequestBody.deleteInDays,
      );
    });

    it("should create new folder when arcId does not exist", async () => {
      // Arrange: Mock service to return new folder
      const newFolder = createMockArchivedFolder({
        id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        arcId: validRequestBody.arcId,
      });

      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockResolvedValue(newFolder);

      // Act
      const response = await app.request("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRequestBody),
      });

      // Assert
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toEqual({
        internalUUID: newFolder.id,
      });
    });

    it("should return 400 when request body is malformed JSON", async () => {
      // Act
      const response = await app.request("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      });

      // Assert
      const responseJson = await response.json();
      expect(response.status).toBe(400);
      expect(responseJson).toEqual({
        message: "Malformed Body",
      });
    });

    it.each([
      {
        case: "missing arcId",
        input: { arcId: undefined, deleteInDays: 30 },
        expectedStatus: 400,
      },
      {
        case: "null arcId",
        input: { arcId: null, deleteInDays: 30 },
        expectedStatus: 400,
      },
      {
        case: "empty arcId",
        input: { arcId: "", deleteInDays: 30 },
        expectedStatus: 400,
      },
      {
        case: "too long arcId (max 50)",
        input: { arcId: "x".repeat(51), deleteInDays: 30 },
        expectedStatus: 400,
      },
      {
        case: "invalid UUID format",
        input: { arcId: "invalid-uuid-format", deleteInDays: 30 },
        expectedStatus: 400,
      },
    ])(
      "should return $expectedStatus when $case",
      async ({ case: testCase, input, expectedStatus }) => {
        const response = await app.request("/api/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        expect(response.status).toBe(expectedStatus);
        const responseJson = await response.json();
        expect(responseJson).toEqual({
          message: "Malformed Body",
        });
      },
    );

    it("should validate deleteInDays field using Zod schema", async () => {
      // Test cases for deleteInDays validation
      const invalidDeleteInCases = [
        { arcId: validRequestBody.arcId, deleteInDays: "30" }, // String instead of number
        { arcId: validRequestBody.arcId, deleteInDays: -1 }, // Negative number
        { arcId: validRequestBody.arcId, deleteInDays: 3.5 }, // Float instead of integer
      ];

      for (const invalidCase of invalidDeleteInCases) {
        const response = await app.request("/api/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invalidCase),
        });

        expect(response.status).toBe(400);
        const responseJson = await response.json();
        expect(responseJson).toEqual({
          message: "Malformed Body",
        });
      }
    });

    it("should use default deleteInDays value when not provided", async () => {
      // Arrange
      const requestWithoutDeleteIn = { arcId: validRequestBody.arcId };
      const mockFolder = createMockArchivedFolder({
        id: "550e8400-e29b-41d4-a716-446655440000",
        arcId: validRequestBody.arcId,
      });

      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockResolvedValue(mockFolder);

      // Act
      const response = await app.request("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestWithoutDeleteIn),
      });

      // Assert
      expect(getOrCreateFolderSpy).toHaveBeenCalledWith(
        validRequestBody.arcId,
        0, // Default value from schema
      );
    });

    it("should return 500 when service throws an error", async () => {
      // Arrange: Mock service to throw error
      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockRejectedValue(new Error("Service error"));

      // Act
      const response = await app.request("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRequestBody),
      });

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/archive/delete (deleteFolder)", () => {
    const validRequestBody: DELETEFolderRequest = {
      id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    };

    it("should delete folder successfully when it exists", async () => {
      // Arrange: Mock service to return true (successful deletion)
      const deleteFolderSpy = spyOn(archiveService, "deleteFolder");
      deleteFolderSpy.mockResolvedValue(true);

      // Act
      const response = await app.request("/api/archive/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRequestBody),
      });

      // Assert
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toBe(true);
      expect(deleteFolderSpy).toHaveBeenCalledWith(validRequestBody.id);
    });

    it("should return false when folder does not exist", async () => {
      // Arrange: Mock service to return false (folder not found)
      const deleteFolderSpy = spyOn(archiveService, "deleteFolder");
      deleteFolderSpy.mockResolvedValue(false);

      // Act
      const response = await app.request("/api/archive/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRequestBody),
      });

      // Assert
      expect(response.status).toBe(200);
      const responseJson = await response.json();
      expect(responseJson).toBe(false);
    });

    it("should validate id format", async () => {
      // Test invalid id formats
      const invalidIds = [
        { id: "" }, // Empty
        { id: "   " }, // Whitespace
        { id: "x".repeat(51) }, // Too long
        { id: "invalid-uuid" }, // Invalid format
        { id: "123" }, // Too short
      ];

      for (const invalidCase of invalidIds) {
        const response = await app.request("/api/archive/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invalidCase),
        });

        expect(response.status).toBe(400);
        const responseJson = await response.json();
        expect(responseJson).toEqual({
          message: "Malformed Body",
        });
      }
    });

    it("should return 500 when service throws an error", async () => {
      // Arrange: Mock service to throw error
      const deleteFolderSpy = spyOn(archiveService, "deleteFolder");
      deleteFolderSpy.mockRejectedValue(new Error("Service error"));

      // Act
      const response = await app.request("/api/archive/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRequestBody),
      });

      // Assert
      expect(response.status).toBe(500);
    });
  });

  // Alternative: Type-safe testing approach using testClient
  describe("Type-safe testing with testClient", () => {
    it("should work with type-safe client", async () => {
      // This approach provides autocompletion and type safety
      const mockFolder = createMockArchivedFolder({
        id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
      });

      const getOrCreateFolderSpy = spyOn(archiveService, "getOrCreateFolder");
      getOrCreateFolderSpy.mockResolvedValue(mockFolder);

      // Note: This requires your app to be properly typed for the client to infer routes
      // You would access it like: client.api.archive.$post({ json: validRequestBody })
      // But since we're binding controller methods, the type inference won't work perfectly

      const response = await app.request("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arcId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          deleteInDays: 30,
        }),
      });

      expect(response.status).toBe(200);
    });
  });
});
