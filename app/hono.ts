import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import type { Context } from "vm";
import { archiveController } from "./api/archive/archive.controller";
import { isDev, isTestRuntime } from "./lib/env";
import { simpleRateLimit } from "./lib/middleware/ratelimit";

export function setupHonoServer() {
  // Create a root Hono app
  const app = new Hono();

  // CORS, CSRF & Security headers middleware
  app.use("*", secureHeaders());
  app.use(csrf());
  app.use(
    "*",
    cors({
      origin: ["http://localhost:3000", "http://localhost:5173"], // Add your frontend URLs
      allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      credentials: true,
    }),
  );

  // Global rate limiting - 100 requests per 15 minutes
  if (!(isDev || isTestRuntime))
    app.use("*", simpleRateLimit(15 * 60 * 1000, 100));

  // Stricter rate limiting for API endpoints - 20 requests per 5 minutes
  if (!(isDev || isTestRuntime))
    app.use("/api/*", simpleRateLimit(5 * 60 * 1000, 20));

  // Archive API Endpoint
  app
    .post("/api/archive", (c) => archiveController.postFolder(c))
    .delete("/api/archive", (c) => archiveController.deleteFolder(c));

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
