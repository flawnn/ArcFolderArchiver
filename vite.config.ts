import { reactRouter } from "@react-router/dev/vite";
import {
  type SentryReactRouterBuildOptions,
  sentryReactRouter,
} from "@sentry/react-router";
import autoprefixer from "autoprefixer";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const sentryConfig: SentryReactRouterBuildOptions = {
  org: "bp-inc",
  project: "arc-folder-archiver",
  // An auth token is required for uploading source maps;
  // store it in an environment variable to keep it secure.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // ...
};

export default defineConfig((config) => {
  return {
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },
    plugins: [
      reactRouterHonoServer({ runtime: "bun" }),
      reactRouter(),
      tsconfigPaths(),
      sentryReactRouter(sentryConfig, config),
    ],
    build: config.isSsrBuild ? { target: "ES2022" } : {},
  };
});
