import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const OPTIONS = [
  {
    name: "Assurance",
    price: 50,
    description: "Couverture assurance mensuelle",
  },
  {
    name: "Contrôle technique",
    price: 5,
    description: "Prise en charge du contrôle technique",
  },
  {
    name: "Entretien",
    price: 30,
    description: "Entretien régulier du véhicule",
  },
  {
    name: "Assistance dépannage",
    price: 15,
    description: "Assistance 24h/24 en cas de panne",
  },
];

async function seedOptions() {
  for (const option of OPTIONS) {
    const existing = await prisma.option.findFirst({
      where: { name: option.name },
    });

    if (existing) {
      console.log(
        `Option "${option.name}" already exists (id=${existing.id}). Skipping.`,
      );
    } else {
      const created = await prisma.option.create({ data: option });
      console.log(`Created option "${created.name}" (id=${created.id}).`);
    }
  }
}

seedOptions()
  .catch((error) => {
    console.error("Error seeding options:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
