import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Ejecutando SEED (admin forzado)...");

  // ---------------------------------------------------------
  // 1) Crear o actualizar usuario admin
  // ---------------------------------------------------------
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash,
      active: true,
    },
    create: {
      username: "admin",
      passwordHash,
      active: true,
      person: {
        create: {
          name: "Administrador",
          email: "admin@aquasmart.com",
        },
      },
    },
    include: { person: true },
  });

  console.log("✔ Usuario admin listo:", {
    id: adminUser.id,
    username: adminUser.username,
    email: adminUser.person?.email,
  });

  // ---------------------------------------------------------
  // 2) Crear grupo ADMIN
  // ---------------------------------------------------------
  const adminGroup = await prisma.group.upsert({
    where: { id: "ADMIN" },
    update: {
      name: "Administrador",
      desc: "Acceso total a la plataforma",
    },
    create: {
      id: "ADMIN",
      name: "Administrador",
      desc: "Acceso total a la plataforma",
    },
  });

  console.log("✔ Grupo ADMIN listo");

  // ---------------------------------------------------------
  // 3) Crear permisos base
  // ---------------------------------------------------------
  const PERMISSIONS = [
    "VIEW_DASHBOARD",
    "VIEW_HISTORY",
    "VIEW_AUDIT",
    "MANAGE_THRESHOLDS",
    "MANAGE_USERS",
    "MANAGE_POOLS",
    "SIMULATE_SENSOR",
  ];

  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        id: code,
        code,
      },
    });
  }

  console.log("✔ Permisos base OK");

  // ---------------------------------------------------------
  // 4) Asignar permisos al grupo ADMIN
  // ---------------------------------------------------------
  for (const code of PERMISSIONS) {
    await prisma.groupPermission.upsert({
      where: {
        groupId_permissionId: {
          groupId: adminGroup.id,
          permissionId: code,
        },
      },
      update: {},
      create: {
        groupId: adminGroup.id,
        permissionId: code,
      },
    });
  }

  console.log("✔ Permisos asignados a ADMIN");

  // ---------------------------------------------------------
  // 5) Vincular usuario admin al grupo ADMIN
  // ---------------------------------------------------------
  await prisma.userGroup.upsert({
    where: {
      userId_groupId: {
        userId: adminUser.id,
        groupId: adminGroup.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      groupId: adminGroup.id,
    },
  });

  console.log("✔ admin ↔ ADMIN vinculado");

  console.log("✅ SEED COMPLETADO");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
