import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", active: true, person: { create: { name: "Admin", email: "admin@local" } } }
  });

  const pool = await prisma.pool.create({
    data: { name: "Piscina Principal", ownerId: admin.id }
  });

  await prisma.threshold.create({ data: { poolId: pool.id } });

  const now = Date.now();
  await prisma.measurement.createMany({
    data: Array.from({ length: 10 }).map((_, i) => ({
      poolId: pool.id,
      ph: 7.2 + (Math.random()-0.5)*0.3,
      freeChlor: 1.0 + (Math.random()-0.5)*0.3,
      tempC: 27 + Math.round((Math.random()-0.5)*3),
      takenAt: new Date(now - (9 - i) * 5 * 60 * 1000)
    }))
  });

  console.log("✅ Seed cargado");
}
main().finally(()=>prisma.$disconnect());
