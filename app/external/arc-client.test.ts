import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { arcClient } from "./arc-client";
import type { ArcFolder } from "./models/arc";

// Mock the external dependencies using Bun's mock.module
mock.module("axios", () => ({
  default: {
    get: mock(() =>
      Promise.resolve({
        data: "",
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      }),
    ),
  },
}));

mock.module("cheerio", () => ({
  load: mock(() => mock(() => ({ html: () => null }))),
}));

const runLive = !!process.env.RUN_LIVE_TESTS;

describe("ArcClient", () => {
  let mockAxiosGet: any;
  let mockCheerioLoad: any;

  beforeEach(async () => {
    // Import the mocked modules to get access to their mocks
    const axios = await import("axios");
    const cheerio = await import("cheerio");

    mockAxiosGet = axios.default.get as any;
    mockCheerioLoad = cheerio.load as any;

    // Reset all mocks before each test
    mockAxiosGet.mockReset();
    mockCheerioLoad.mockReset();
  });

  afterEach(() => {
    // Clean up after each test
    mockAxiosGet.mockRestore();
    mockCheerioLoad.mockRestore();
  });

  describe("extractFolderData", () => {
    const validArcId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const invalidId = "not-a-url";
    const nonArcId = "https://google.com";

    it("should extract JSON correctly with valid Arc ID and well-formed data", async () => {
      // Arrange: Mock successful HTTP response with valid HTML containing JSON
      const mockArcData: ArcFolder = {
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

      const mockHTML = `
        <html>
          <body>
            <script id="__NEXT_DATA__">
              {"props":{"pageProps":${JSON.stringify(mockArcData)}}}
            </script>
          </body>
        </html>
      `;

      const mockCheerioInstance = {
        html: () => `{"props":{"pageProps":${JSON.stringify(mockArcData)}}}`,
      };

      const mockCheerioSelector = mock(() => mockCheerioInstance);

      mockAxiosGet.mockResolvedValue({
        data: mockHTML,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      });

      // cheerio.load returns a function that can be called with a selector
      mockCheerioLoad.mockReturnValue(mockCheerioSelector);

      // Act
      const result = await arcClient.extractFolderData(validArcId);

      // Assert
      expect(mockAxiosGet).toHaveBeenCalledWith(
        "https://arc.net/folder/" + validArcId,
      );
      expect(result).toEqual(mockArcData);
    });

    it("should throw error with invalid ID format", async () => {
      // Act & Assert
      await expect(arcClient.extractFolderData(invalidId)).rejects.toThrow();
    });

    it("should throw error with non-Arc ID", async () => {
      // Act & Assert
      await expect(arcClient.extractFolderData(nonArcId)).rejects.toThrow();
    });

    it("should throw error when HTML document is malformed or missing script tag", async () => {
      // Arrange: Mock response with HTML missing the required script tag
      const mockHTML = `<html><body><p>No script tag here</p></body></html>`;
      const mockCheerioInstance = { html: () => null };
      const mockCheerioSelector = mock(() => mockCheerioInstance);

      mockAxiosGet.mockResolvedValue({
        data: mockHTML,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      });
      mockCheerioLoad.mockReturnValue(mockCheerioSelector);

      // Act & Assert
      await expect(arcClient.extractFolderData(validArcId)).rejects.toThrow();
    });

    it("should throw error when JSON in script tag is malformed", async () => {
      // Arrange: Mock response with invalid JSON
      const mockHTML = `
        <html>
          <body>
            <script id="__NEXT_DATA__">
              { invalid json content
            </script>
          </body>
        </html>
      `;

      const mockCheerioInstance = { html: () => "{ invalid json content" };
      const mockCheerioSelector = mock(() => mockCheerioInstance);

      mockAxiosGet.mockResolvedValue({
        data: mockHTML,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      });
      mockCheerioLoad.mockReturnValue(mockCheerioSelector);

      // Act & Assert
      await expect(arcClient.extractFolderData(validArcId)).rejects.toThrow();
    });

    it("should throw error when JSON structure is unexpected (missing folder data path)", async () => {
      // Arrange: Mock response with valid JSON but wrong structure
      const mockHTML = `
        <html>
          <body>
            <script id="__NEXT_DATA__">
              {"props":{"pageProps":{"wrongStructure":"data"}}}
            </script>
          </body>
        </html>
      `;

      const mockCheerioInstance = {
        html: () => `{"props":{"pageProps":{"wrongStructure":"data"}}}`,
      };
      const mockCheerioSelector = mock(() => mockCheerioInstance);

      mockAxiosGet.mockResolvedValue({
        data: mockHTML,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      });
      mockCheerioLoad.mockReturnValue(mockCheerioSelector);

      // Act & Assert
      await expect(arcClient.extractFolderData(validArcId)).rejects.toThrow();
    });

    it("should throw error on connection issues (timeout, DNS, 404, 500)", async () => {
      // Test cases for different connection issues
      const connectionErrors = [
        new Error("ENOTFOUND - DNS resolution failed"),
        new Error("ETIMEDOUT - Request timeout"),
        { response: { status: 404 } }, // 404 Not Found
        { response: { status: 500 } }, // 500 Internal Server Error
      ];

      for (const error of connectionErrors) {
        // Arrange
        mockAxiosGet.mockRejectedValue(error);

        // Act & Assert
        await expect(arcClient.extractFolderData(validArcId)).rejects.toThrow();

        // Reset for next iteration
        mockAxiosGet.mockReset();
      }
    });

    it("should handle edge case: empty folder data", async () => {
      // Arrange: Mock response with empty but valid folder data
      const mockEmptyArcData: ArcFolder = {
        data: {
          items: [],
          rootID: "123e4567-e89b-12d3-a456-426614174001",
          root: "123e4567-e89b-12d3-a456-426614174001",
        },
        shareID: "123e4567-e89b-12d3-a456-426614174003",
        author: "Test Author",
      };

      const mockHTML = `
        <html>
          <body>
            <script id="__NEXT_DATA__">
              {"props":{"pageProps":${JSON.stringify(mockEmptyArcData)}}}
            </script>
          </body>
        </html>
      `;

      const mockCheerioInstance = {
        html: () =>
          `{"props":{"pageProps":${JSON.stringify(mockEmptyArcData)}}}`,
      };
      const mockCheerioSelector = mock(() => mockCheerioInstance);

      mockAxiosGet.mockResolvedValue({
        data: mockHTML,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      });
      mockCheerioLoad.mockReturnValue(mockCheerioSelector);

      // Act
      const result = await arcClient.extractFolderData(validArcId);

      // Assert
      expect(result).toEqual(mockEmptyArcData);
    });
  });

  (runLive ? describe : describe.skip)(
    "extractFolderData - Integration Tests",
    () => {
      beforeEach(() => {
        // Restore mocks for integration tests - we want real HTTP calls
        mockAxiosGet.mockRestore();
        mockCheerioLoad.mockRestore();
      });

      it("should extract real folder data from live Arc ID", async () => {
        // Arrange: Use real Arc ID without mocks
        const realArcId = "353E959D-51B9-439E-931A-6579C529306D";

        // Act
        const result = await arcClient.extractFolderData(realArcId);

        // Assert
        expect(result).toBeDefined();
        expect(result).toBeTypeOf("object");

        if (result) {
          expect(result).toHaveProperty("data");
          expect(result).toHaveProperty("shareID");
          expect(result).toHaveProperty("author");
          expect(result.data).toHaveProperty("items");
          expect(result.data).toHaveProperty("rootID");
          expect(result.data).toHaveProperty("root");
          expect(Array.isArray(result.data.items)).toBe(true);
          expect(typeof result.author).toBe("string");
        }
      }, 10000);
    },
  );
});
