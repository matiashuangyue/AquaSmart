// prisma/seed.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Creamos una piscina
  const pool = await prisma.pool.upsert({
    where: { id: "pool1" },
    update: {},
    create: { id: "pool1", name: "Piscina Principal" }
  });

  // Creamos umbrales
  await prisma.threshold.upsert({
    where: { poolId: pool.id },
    update: {},
    create: {
      poolId: pool.id,
      phMin: 7.2, phMax: 7.8,
      chlorMin: 0.5, chlorMax: 1.5,
      tempMin: 20, tempMax: 35
    }
  });

  // Cargar 10 mediciones históricas
  const now = Date.now();
  const items = Array.from({ length: 10 }).map((_, i) => ({
    poolId: pool.id,
    ph: 7.2 + (Math.random() - 0.5) * 0.4,
    freeChlor: 1.0 + (Math.random() - 0.5) * 0.3,
    tempC: 27 + Math.round((Math.random() - 0.5) * 3),
    takenAt: new Date(now - (9 - i) * 5 * 60 * 1000)
  }));

  await prisma.measurement.createMany({ data: items });

  console.log("✅ Seed completado con piscina, umbrales y mediciones");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
