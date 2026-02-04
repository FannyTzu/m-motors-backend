import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 12;

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Admin email or password is not set in environment variables.",
    );
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { mail: adminEmail },
  });
  if (existingAdmin) {
    console.log("Admin user already exists. Skipping seeding.");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  await prisma.user.create({
    data: {
      mail: adminEmail,
      password_hash: hashedPassword,
      role: "admin",
    },
  });
}

seedAdmin()
  .catch((error) => {
    console.error("Error seeding admin user:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
