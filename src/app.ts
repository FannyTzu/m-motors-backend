import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createVehicleRoutes } from "./routes/vehicle.routes.js";
import { createHealthRoutes } from "./routes/health.routes.js";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import { createFolderRoutes } from "./routes/folder.routes.js";
import { documentRoutes } from "./routes/document.routes.js";
import { createOrderRoutes } from "./routes/order.routes.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const app = express();

// FRONTEND_URL accept one or many origins separaed by ","
const envOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...envOrigins,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
]);

// dev : accept all - prod : only allowedOrigins
const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => {
  if (!origin) {
    return callback(null, true);
  }

  const isLocalDevOrigin =
    process.env.NODE_ENV !== "production" &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  if (isLocalDevOrigin || allowedOrigins.has(origin)) {
    return callback(null, true);
  }

  callback(new Error(`Not allowed by CORS: ${origin}`));
};

// CORS config
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());

app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "M-Motors API is running" });
});

// Health & Monitoring Routes
app.use("/", createHealthRoutes(prisma));

// all routes features
app.use("/auth", createAuthRoutes(prisma));
app.use("/vehicle", createVehicleRoutes(prisma));
app.use("/folder", createFolderRoutes(prisma));
app.use("/documents", documentRoutes(prisma));
app.use("/orders", createOrderRoutes(prisma));

Sentry.setupExpressErrorHandler(app);

app.use(function onError(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  console.error("Error:", err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    eventId: res.locals.errorId,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});
