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

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "M-Motors API is running" });
});

// Health & Monitoring Routes
app.use("/", createHealthRoutes(prisma));

// Test Sentry - (todo delete this route in production)
app.get("/debug-sentry", (req, res) => {
  console.log("🧪 Test Sentry avec throw...");
  throw new Error("Test Sentry - Erreur volontaire pour tester le monitoring");
});

app.use("/auth", createAuthRoutes(prisma));
app.use("/vehicle", createVehicleRoutes(prisma));

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
