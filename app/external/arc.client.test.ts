import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import * as cheerio from "cheerio";
import { arcClient } from "./arc.client";

// Mock the external dependencies
const mockedAxios = mock(axios.get);
const mockedCheerio = mock(cheerio.load);

describe("ArcClient", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockedAxios.mockReset();
    mockedCheerio.mockReset();
  });

  afterEach(() => {
    // Clean up after each test
    mockedAxios.mockRestore();
    mockedCheerio.mockRestore();
  });

  describe("extractFolderData", () => {
    const validArcUrl = "https://arc.net/folder/123ABC";
    const invalidUrl = "not-a-url";
    const nonArcUrl = "https://google.com";

    it("should extract JSON correctly with valid Arc URL and well-formed data", async () => {
      // Arrange: Mock successful HTTP response with valid HTML containing JSON
      const mockHTML = `
        <html>
          <body>
            <script id="__NEXT_DATA__">
              {"props":{"pageProps":{"folderData":{"name":"Test Folder","tabs":[{"url":"https://example.com","title":"Example"}]}}}}
            </script>
          </body>
        </html>
      `;

      const mockCheerioInstance = {
        html: () =>
          `{"props":{"pageProps":{"folderData":{"name":"Test Folder","tabs":[{"url":"https://example.com","title":"Example"}]}}}}`,
      };
      const mockCheerioSelector = mock(() => mockCheerioInstance);
      const mockCheerioLoad = mock(() => mockCheerioSelector);

      mockedAxios.mockResolvedValue({ data: mockHTML });
      mockedCheerio.mockReturnValue(mockCheerioLoad);

      // Act
      const result = await arcClient.extractFolderData(validArcUrl);

      // Assert
      expect(mockedAxios).toHaveBeenCalledWith(validArcUrl);
      expect(result).toEqual({
        name: "Test Folder",
        tabs: [{ url: "https://example.com", title: "Example" }],
      });
    });

    it("should throw error with invalid URL format", async () => {
      // Act & Assert
      await expect(arcClient.extractFolderData(invalidUrl)).rejects.toThrow();
    });

    it("should throw error with non-Arc URL", async () => {
      // Act & Assert
      await expect(arcClient.extractFolderData(nonArcUrl)).rejects.toThrow();
    });

    it("should throw error when HTML document is malformed or missing script tag", async () => {
      // Arrange: Mock response with HTML missing the required script tag
      const mockHTML = `<html><body><p>No script tag here</p></body></html>`;
      const mockCheerioInstance = { html: () => null };
      const mockCheerioSelector = mock(() => mockCheerioInstance);
      const mockCheerioLoad = mock(() => mockCheerioSelector);

      mockedAxios.mockResolvedValue({ data: mockHTML });
      mockedCheerio.mockReturnValue(mockCheerioLoad);

      // Act & Assert
      await expect(arcClient.extractFolderData(validArcUrl)).rejects.toThrow();
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
      const mockCheerioLoad = mock(() => mockCheerioSelector);

      mockedAxios.mockResolvedValue({ data: mockHTML });
      mockedCheerio.mockReturnValue(mockCheerioLoad);

      // Act & Assert
      await expect(arcClient.extractFolderData(validArcUrl)).rejects.toThrow();
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
      const mockCheerioLoad = mock(() => mockCheerioSelector);

      mockedAxios.mockResolvedValue({ data: mockHTML });
      mockedCheerio.mockReturnValue(mockCheerioLoad);

      // Act & Assert
      await expect(arcClient.extractFolderData(validArcUrl)).rejects.toThrow();
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
        mockedAxios.mockRejectedValue(error);

        // Act & Assert
        await expect(
          arcClient.extractFolderData(validArcUrl),
        ).rejects.toThrow();

        // Reset for next iteration
        mockedAxios.mockReset();
      }
    });

    it("should handle edge case: empty folder data", async () => {
      // Arrange: Mock response with empty but valid folder data
      const mockHTML = `
        <html>
          <body>
            <script id="__NEXT_DATA__">
              {"props":{"pageProps":{"folderData":{"name":"Empty Folder","tabs":[]}}}}
            </script>
          </body>
        </html>
      `;

      const mockCheerioInstance = {
        html: () =>
          `{"props":{"pageProps":{"folderData":{"name":"Empty Folder","tabs":[]}}}}`,
      };
      const mockCheerioSelector = mock(() => mockCheerioInstance);
      const mockCheerioLoad = mock(() => mockCheerioSelector);

      mockedAxios.mockResolvedValue({ data: mockHTML });
      mockedCheerio.mockReturnValue(mockCheerioLoad);

      // Act
      const result = await arcClient.extractFolderData(validArcUrl);

      // Assert
      expect(result).toEqual({
        name: "Empty Folder",
        tabs: [],
      });
    });
  });
});
