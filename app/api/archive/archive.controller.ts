import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  DELETEFolderRequestSchema,
  DELETEFolderResponseSchema,
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
    const body = POSTFolderRequestSchema.safeParse(await c.req.json()).data;

    if (!body) {
      throw new HTTPException(400, { message: "Malformed Body" });
    }

    // Not relevant for now - we will just allow the user to delete a folder
    // const deleteInDays = body.deleteInDays;

    const internalUUID = await this._archiveService.getOrCreateFolder(
      body.arcId,
      body.deleteInDays,
    );

    return c.json({
      internalUUID: internalUUID,
    } satisfies POSTFolderResponse);
  }

  async deleteFolder(c: Context) {
    const body = DELETEFolderRequestSchema.safeParse(await c.req.json()).data;

    if (!body) {
      throw new HTTPException(400, { message: "Malformed Body" });
    }

    const result = await this._archiveService.deleteFolder(body.arcId);

    return c.json(DELETEFolderResponseSchema.parse(result));
  }
}

export const archiveController = new ArchiveController();
