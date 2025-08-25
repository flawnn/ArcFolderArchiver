import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Class that handles API Endpoint logic for /archive/
 */
class ArchiveController {
  async postFolder(c: Context) {
    const body = await c.req.json();
    const folderId = body.folderId;

    if (!folderId) {
      throw new HTTPException(400, { message: "Folder ID is required" });
    }

    // TODO: Implement logic

    return c.json({
      folderId,
      message: "Folder retrieved successfully",
    });
  }

  async deleteFolder(c: Context) {
    const body = await c.req.json();
    const folderId = body.folderId;

    if (!folderId) {
      throw new HTTPException(400, { message: "Folder ID is required" });
    }

    // TODO: Implement logic

    return c.json({
      folderId,
      message: "Folder retrieved successfully",
    });
  }
}

export const archiveController = new ArchiveController();
