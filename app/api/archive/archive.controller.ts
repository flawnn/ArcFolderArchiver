import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  type DELETEFolderRequest,
  DELETEFolderRequestSchema,
  DELETEFolderResponseSchema,
  type POSTFolderRequest,
  POSTFolderRequestSchema,
  type POSTFolderResponse,
} from "../models/archive";
import { ArchiveService, archiveService } from "./archive.service";

/**
 * Class that handles API Endpoint logic for /archive/
 */
class ArchiveController {
  private _archiveService: ArchiveService;

  constructor(service: ArchiveService = archiveService) {
    this._archiveService = service;
  }

  async postFolder(c: Context) {
    let body: POSTFolderRequest;

    try {
      body = POSTFolderRequestSchema.parse(await c.req.json());
    } catch (e) {
      throw new HTTPException(400, {
        res: c.json({ message: "Malformed Body" }),
      });
    }

    // Not relevant for now - we will just allow the user to delete a folder
    // const deleteInDays = body.deleteInDays;

    const folder = await this._archiveService.getOrCreateFolder(
      body.arcId,
      body.deleteInDays,
    );

    return c.json({
      internalUUID: folder!.id,
    } satisfies POSTFolderResponse);
  }

  async deleteFolder(c: Context) {
    let body: DELETEFolderRequest;

    try {
      body = DELETEFolderRequestSchema.parse(await c.req.json());
    } catch {
      throw new HTTPException(400, {
        res: c.json({ message: "Malformed Body" }),
      });
    }

    const result = await this._archiveService.deleteFolder(body.id);

    return c.json(DELETEFolderResponseSchema.parse(result));
  }
}

export const archiveController = new ArchiveController();
