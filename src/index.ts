import express from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createAuthRoutes } from "./routes/auth.routes.js";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/auth", createAuthRoutes(prisma));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
