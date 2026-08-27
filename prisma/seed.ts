import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const clients: Array<{ name: string; hourlyRate: number | null; notes?: string }> = [
  { name: "Drink Palestina", hourlyRate: 35.0 },
  { name: "Nominal", hourlyRate: 35.0 },
  { name: "Optimal Marketing LTD", hourlyRate: 35.0 },
  { name: "Avanchy", hourlyRate: null },
  { name: "21st Solutions LLC", hourlyRate: null },
  { name: "Lead Endeavour USA LLC", hourlyRate: null, notes: "Rate TBD per client sheet." },
  { name: "FSFNYC Inc", hourlyRate: 25.0 },
  { name: "Blix", hourlyRate: null },
  { name: "Skalli Essentials", hourlyRate: 30.0 },
  { name: "Makks", hourlyRate: 35.0 },
  { name: "Noun Naturals", hourlyRate: null },
];

async function main() {
  for (const c of clients) {
    const existing = await prisma.client.findFirst({ where: { name: c.name } });
    if (existing) continue;
    await prisma.client.create({ data: c });
  }

  await prisma.businessSettings.upsert({
    where: { id: 1 },
    create: { id: 1, businessName: "Your Business Name", businessInfo: "Address line 1\nCity, ST ZIP\nphone@example.com" },
    update: {},
  });

  console.log(`Seeded ${clients.length} clients.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
