import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://08e8b381479ca3884eb89f8139754bac@o4510866352635904.ingest.de.sentry.io/4510866361614416",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0,
});
