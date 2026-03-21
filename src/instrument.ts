import * as Sentry from "@sentry/node";

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
  });
}
