import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // contraseña temporal para usuarios existentes (cambiala después)
  const TEMP_PW = "changeme123";
  const hash = await bcrypt.hash(TEMP_PW, 10);

  const updated = await prisma.user.updateMany({
    where: { OR: [{ passwordHash: null }, { passwordHash: "" }] },
    data: { passwordHash: hash }
  });

  console.log(`Backfill listo: ${updated.count} usuario(s) actualizados con contraseña temporal "${TEMP_PW}"`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
