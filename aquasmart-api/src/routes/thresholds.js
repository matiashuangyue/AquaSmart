// src/routes/thresholds.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";
import { audit } from "../infra/logger.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/thresholds/:poolId
 * Devuelve los umbrales de una pileta del usuario logueado
 */
router.get("/:poolId", requireAuth, async (req, res) => {
  const { poolId } = req.params;
  const userId = req.user.sub;

  try {
    // verificamos que la pileta sea del usuario
    const pool = await prisma.pool.findFirst({
      where: { id: poolId, ownerId: userId },
    });
    if (!pool) {
      return res.status(404).json({ error: "Pileta no encontrada" });
    }

    const th = await prisma.threshold.findUnique({
      where: { poolId: pool.id },
    });

    if (!th) {
      // no hay registro aún para esa pileta
      return res.status(404).json({ error: "Sin umbrales para esta pileta" });
    }

    res.json({
      id: th.id,
      poolId: th.poolId,
      phMin: th.phMin,
      phMax: th.phMax,
      chlorMin: th.chlorMin,
      chlorMax: th.chlorMax,
      tempMin: th.tempMin,
      tempMax: th.tempMax,
      estadoUmbral: th.estadoUmbral,
      notas: th.notas,
      modificadoPor: th.modificadoPor,
      version: th.version,
      updatedAt: th.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando umbrales" });
  }
});

/**
 * POST /api/thresholds/:poolId
 * Crea o actualiza (upsert) los umbrales de una pileta
 * body: { phMin, phMax, chlorMin, chlorMax, tempMin, tempMax }
 */
router.post("/:poolId", requireAuth, async (req, res) => {
  const { poolId } = req.params;
  const userId = req.user.sub;
  const {
    phMin,
    phMax,
    chlorMin,
    chlorMax,
    tempMin,
    tempMax,
  } = req.body;

  try {
    const pool = await prisma.pool.findFirst({
      where: { id: poolId, ownerId: userId },
    });
    if (!pool) {
      return res.status(404).json({ error: "Pileta no encontrada" });
    }

    if (
      phMin == null ||
      phMax == null ||
      chlorMin == null ||
      chlorMax == null ||
      tempMin == null ||
      tempMax == null
    ) {
      return res
        .status(400)
        .json({ error: "Faltan valores de umbrales en el body" });
    }

    const th = await prisma.threshold.upsert({
      where: { poolId: pool.id },
      update: {
        phMin,
        phMax,
        chlorMin,
        chlorMax,
        tempMin,
        tempMax,
        modificadoPor: userId,
        version: { increment: 1 },
      },
      create: {
        poolId: pool.id,
        phMin,
        phMax,
        chlorMin,
        chlorMax,
        tempMin,
        tempMax,
        modificadoPor: userId,
      },
    });

    // 📝 Auditoría (igual idea que en index.js)
    await audit({
      userId,
      action: "EDITAR_UMBRAL",
      module: "Umbrales",
      detail: `Actualizó umbrales de la pileta "${pool.name}"`,
      poolId: pool.id,
    });

    res.json({
      id: th.id,
      poolId: th.poolId,
      phMin: th.phMin,
      phMax: th.phMax,
      chlorMin: th.chlorMin,
      chlorMax: th.chlorMax,
      tempMin: th.tempMin,
      tempMax: th.tempMax,
      estadoUmbral: th.estadoUmbral,
      notas: th.notas,
      modificadoPor: th.modificadoPor,
      version: th.version,
      updatedAt: th.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error guardando umbrales" });
  }
});

export default router;
