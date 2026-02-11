import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  enabled: true,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  debug: false,

  beforeSend(event) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "Sentry:",
        event.exception?.values?.[0]?.value || event.message,
      );
    }
    return event;
  },
});
