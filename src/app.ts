import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createAuthRoutes } from "./routes/auth.routes";
import { createVehicleRoutes } from "./routes/vehicle.routes";
import cookieParser from "cookie-parser";
import "dotenv/config";
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

// test Sentry (TO DO : delete before production)
if (process.env.NODE_ENV !== "production") {
  app.get("/debug-sentry", (req, res) => {
    throw new Error(
      "Test Sentry - Erreur volontaire pour tester le monitoring",
    );
  });
}

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
