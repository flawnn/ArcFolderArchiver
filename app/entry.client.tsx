import * as Sentry from "@sentry/react-router";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
Sentry.init({
  dsn: "https://fab902d034de929ced5f4abae6791f3c@o4510081291124736.ingest.de.sentry.io/4510081293287504",
  sendDefaultPii: true,
  integrations: [
    //  performance
    Sentry.reactRouterTracingIntegration(),
    //  performance
    //  session-replay
    Sentry.replayIntegration(),
    //  session-replay
    //  user-feedback
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
    //  user-feedback
  ],
  //  logs
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,
  enableLogs: true,
  // Set `tracePropagationTargets` to declare which URL(s) should have trace propagation enabled
  tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],
  replaysOnErrorSampleRate: 1.0,
  //  session-replay
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
