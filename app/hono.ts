import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Context } from "vm";
import { archiveController } from "./api/archive/archive.controller";

export function setupHonoServer() {
  // Create a root Hono app
  const app = new Hono();

  // Archive API Endpoint
  app
    .post("/api/archive", (c) => archiveController.postFolder(c))
    .post("/api/archive/delete", (c) => archiveController.deleteFolder(c));

  app.onError((err: Error | HTTPException, c: Context) => {
    console.log("=== Caught Error ===");
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    console.error(err);
    return c.text("Something went wrong", 500);
  });

  return app;
}