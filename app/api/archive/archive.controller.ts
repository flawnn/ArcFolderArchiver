import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { transformArcToSharedFolder } from "~/external/arc-transformer";
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

    // If jsonOnly, just fetch & the fetched folder
    // (Yes, it might be that the folder already exists in the database, but as this is just a JSON Request, we will not write extra logic"
    if (body.jsonOnly) {
      const fetchedFolder = await this._archiveService.fetchFolder(body.arcId);
      return c.json(transformArcToSharedFolder(fetchedFolder));
    }

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
