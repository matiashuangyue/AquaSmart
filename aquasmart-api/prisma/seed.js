// prisma/seed.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Usuario admin (con Person y passwordHash)
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      active: true,
      passwordHash: "admin-hash-demo", // TODO: reemplazar por hash real
      person: {
        create: {
          name: "Admin",
          email: "admin@local",
        },
      },
    },
  });

  // Pool principal con threshold usando defaults
  const pool = await prisma.pool.create({
    data: {
      name: "Piscina Principal",
      owner: { connect: { id: admin.id } },
      threshold: {
        create: {}, // usa los valores por defecto del modelo Threshold
      },
    },
  });

  const now = Date.now();

  // 10 lecturas cada 5 minutos, con parámetros anidados
  const lecturasPromises = Array.from({ length: 10 }).map((_, i) => {
    const ph = 7.2 + (Math.random() - 0.5) * 0.3;
    const freeChlor = 1.0 + (Math.random() - 0.5) * 0.3;
    const tempC = 27 + Math.round((Math.random() - 0.5) * 3);

    return prisma.sensorLectura.create({
      data: {
        pool: { connect: { id: pool.id } },
        fechaHora: new Date(now - (9 - i) * 5 * 60 * 1000),
        parametros: {
          create: [
            { tipo: "PH", unidad: "", valor: ph },
            { tipo: "CLORO_LIBRE", unidad: "ppm", valor: freeChlor },
            { tipo: "TEMP", unidad: "°C", valor: tempC },
          ],
        },
      },
    });
  });

  await Promise.all(lecturasPromises);

  console.log("✅ Seed cargado");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
