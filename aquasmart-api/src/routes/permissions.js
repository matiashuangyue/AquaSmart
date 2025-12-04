import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/permissions
 * Lista todos los permisos existentes
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const perms = await prisma.permission.findMany({
      orderBy: { code: "asc" },
    });

    // devolvemos solo lo necesario
    res.json(
      perms.map((p) => ({
        id: p.id,
        code: p.code,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando permisos" });
  }
});

/**
 * POST /api/permissions
 * Crea un nuevo permiso a partir de un code
 * body: { code: "VIEW_DASHBOARD" }
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: "code requerido" });
    }

    const normalized = code.trim().toUpperCase().replace(/\s+/g, "_");

    const exists = await prisma.permission.findUnique({
      where: { code: normalized },
    });
    if (exists) {
      return res
        .status(409)
        .json({ error: "Ya existe un permiso con ese code" });
    }

    const perm = await prisma.permission.create({
      data: { code: normalized },
    });

    res.status(201).json({
      id: perm.id,
      code: perm.code,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando permiso" });
  }
});

export default router;
