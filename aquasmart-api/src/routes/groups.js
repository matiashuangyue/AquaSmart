import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/groups
 * Devuelve grupos + los códigos de permisos asociados
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
      include: {
        perms: {
          include: {
            permission: true,
          },
        },
      },
    });

    res.json(
      groups.map((g) => ({
        id: g.id,
        name: g.name,
        desc: g.desc,
        // códigos de permisos asociados a este grupo, ej: ["VIEW_DASHBOARD", "MANAGE_USERS"]
        permissionCodes: g.perms.map((gp) => gp.permission.code),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando grupos" });
  }
});

/**
 * POST /api/groups/:groupId/permissions/:code
 * Asigna un permiso (por code) a un grupo
 */
router.post("/:groupId/permissions/:code", requireAuth, async (req, res) => {
  const { groupId, code } = req.params;

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    const permission = await prisma.permission.findUnique({
      where: { code },
    });
    if (!permission) {
      return res.status(404).json({ error: "Permiso no encontrado" });
    }

    // evitar duplicado
    const existing = await prisma.groupPermission.findUnique({
      where: {
        groupId_permissionId: {
          groupId: group.id,
          permissionId: permission.id,
        },
      },
    });

    if (!existing) {
      await prisma.groupPermission.create({
        data: {
          groupId: group.id,
          permissionId: permission.id,
        },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error asignando permiso al grupo" });
  }
});

/**
 * DELETE /api/groups/:groupId/permissions/:code
 * Quita un permiso (por code) de un grupo
 */
router.delete(
  "/:groupId/permissions/:code",
  requireAuth,
  async (req, res) => {
    const { groupId, code } = req.params;

    try {
      const permission = await prisma.permission.findUnique({
        where: { code },
      });
      if (!permission) {
        return res.status(404).json({ error: "Permiso no encontrado" });
      }

      await prisma.groupPermission.deleteMany({
        where: {
          groupId,
          permissionId: permission.id,
        },
      });

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error quitando permiso del grupo" });
    }
  }
);

export default router;
