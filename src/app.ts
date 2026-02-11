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

// Route test Sentry
app.get("/debug-sentry", (req, res) => {
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
  res.statusCode = 500;
  res.json({ error: "Internal server error", eventId: res.locals.errorId });
});
