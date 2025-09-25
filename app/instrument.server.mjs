import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: "https://fab902d034de929ced5f4abae6791f3c@o4510081291124736.ingest.de.sentry.io/4510081293287504",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  //  logs
  // Enable logs to be sent to Sentry
  enableLogs: true,
  //  profiling
  //  performance
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  //  performance
  //  profiling
  profilesSampleRate: 1.0, // profile every transaction
  //  profiling
});
