// src/routes/audit.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

// GET /api/audit
router.get("/", requireAuth, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { fechaHora: "desc" },
      include: { user: true },
      take: 500, // límite razonable
    });

    const data = logs.map((l) => ({
      id: l.id,
      usuario: l.user?.username || "(sistema)",
      accion: l.action,
      modulo: l.module,
      detalle: l.detail,
      fechaHora: l.fechaHora,
    }));

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error cargando auditoría" });
  }
});

export default router;

