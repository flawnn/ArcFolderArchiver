import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createHonoServer } from "react-router-hono-server/bun";
import { archiveController } from "./api/archive/archive.controller";

// Create a root Hono app
const app = new Hono();

// Archive API Endpoint
app
  .post("/api/archive", archiveController.postFolder)
  .delete("/api/archive", archiveController.deleteFolder);

app.onError((err: Error | HTTPException, c: Context) => {
  console.log("=== Caught Error ===");
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(err);
  return c.text("Something went wrong", 500);
});

export default await createHonoServer({
  app,
});
