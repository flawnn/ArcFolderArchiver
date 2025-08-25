import { Hono } from "hono";
import { createHonoServer } from "react-router-hono-server/bun";
import { archiveController } from "./api/archive/archive.controller";

// Create a root Hono app
const app = new Hono();

// Archive API Endpoint
app
  .post("/api/archive", archiveController.postFolder)
  .delete("/api/archive", archiveController.deleteFolder);

export default await createHonoServer({
  app,
});
