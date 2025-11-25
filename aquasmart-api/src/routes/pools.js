// src/routes/pools.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

// GET /api/pools  -> piletas del usuario logueado
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const pools = await prisma.pool.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
    });

    res.json(pools);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo piletas" });
  }
});

// GET /api/pools/:id -> una pileta del usuario (detalle)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;

    const pool = await prisma.pool.findFirst({
      where: { id, ownerId: userId },
    });

    if (!pool) return res.status(404).json({ error: "Pileta no encontrada" });

    res.json(pool);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo la pileta" });
  }
});

// POST /api/pools  -> crear nueva pileta
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "El nombre de la pileta es obligatorio" });
    }

    const pool = await prisma.pool.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        estadoPileta: "OK",
        threshold: { create: {} }, // usa defaults
      },
      include: { threshold: true },
    });

    res.status(201).json(pool);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando la pileta" });
  }
});

// PUT /api/pools/:id -> actualizar datos físicos / estado
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    const {
      name,
      volumen,
      largo,
      ancho,
      profundidadPromedio,
      estadoPileta,
    } = req.body;

    const existing = await prisma.pool.findFirst({
      where: { id, ownerId: userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Pileta no encontrada" });
    }

    const updated = await prisma.pool.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        volumen: volumen !== undefined && volumen !== null ? volumen : null,
        largo: largo !== undefined && largo !== null ? largo : null,
        ancho: ancho !== undefined && ancho !== null ? ancho : null,
        profundidadPromedio:
          profundidadPromedio !== undefined && profundidadPromedio !== null
            ? profundidadPromedio
            : null,
        estadoPileta:
          estadoPileta !== undefined && estadoPileta.trim()
            ? estadoPileta.trim()
            : existing.estadoPileta,
      },
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando la pileta" });
  }
});

export default router;
