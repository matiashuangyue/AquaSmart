// src/infra/logger.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Registra un evento de auditoría.
 * @param {Object} params
 * @param {string|null} params.userId  ID de usuario (o null si sistema)
 * @param {string} params.action       Código de acción, ej: "LOGIN", "CREAR_PILETA"
 * @param {string} params.module       Módulo, ej: "Auth", "Piletas", "Umbrales"
 * @param {string} params.detail       Descripción legible
 * @param {string|null} [params.poolId] ID de pileta (opcional)
 */
export async function audit({ userId = null, action, module, detail, poolId = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        detail,
        poolId,
      },
    });
  } catch (err) {
    console.error("Error registrando auditoría:", err);
  }
}
