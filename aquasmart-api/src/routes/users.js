// src/routes/users.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";
import { audit } from "../infra/logger.js";

const prisma = new PrismaClient();
const router = Router();

// GET /api/users
router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        person: true,
        groups: { include: { group: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = users.map((u) => {
      const firstGroup = u.groups[0]?.group;
      return {
        id: u.id,
        email: u.person?.email || "",
        groupId: firstGroup?.id || null,
        groupName: firstGroup?.name || null, // 👈 acá va "Administrador"
        active: u.active,
        createdAt: u.createdAt,
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando usuarios" });
  }
});

// POST /api/users
router.post("/", requireAuth, async (req, res) => {
  try {
    const { email, groupId, active } = req.body;

    if (!email) return res.status(400).json({ error: "Email requerido" });
    if (!groupId) return res.status(400).json({ error: "groupId requerido" });

    const exists = await prisma.person.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email ya registrado" });

    const user = await prisma.user.create({
      data: {
        username: email.split("@")[0],
        passwordHash: "temp_hash",
        active,
        person: { create: { name: email, email } },
      },
    });

    await prisma.userGroup.create({
      data: {
        userId: user.id,
        groupId, // 👈 grupo real (ej id de "Administrador")
      },
    });

    await audit({
      userId: req.user.sub,
      action: "CREAR_USUARIO",
      module: "Usuarios",
      detail: `Creó usuario ${email}`,
    });

    res.status(201).json({
      id: user.id,
      email,
      groupId,
      groupName: null, // si querés, podrías recargar el grupo para devolver name
      active,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando usuario" });
  }
});

// PUT /api/users/:id
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, groupId, active } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { person: true },
    });
    if (!user) return res.status(404).json({ error: "No existe el usuario" });

    if (email) {
      await prisma.person.update({
        where: { userId: id },
        data: { email, name: email },
      });
    }

    await prisma.user.update({
      where: { id },
      data: { active },
    });

    if (groupId) {
      await prisma.userGroup.deleteMany({ where: { userId: id } });
      await prisma.userGroup.create({
        data: { userId: id, groupId },
      });
    }

    await audit({
      userId: req.user.sub,
      action: "EDITAR_USUARIO",
      module: "Usuarios",
      detail: `Editó usuario ${email || id}`,
    });

    res.json({ id, email: email ?? user.person?.email, groupId, active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error editando usuario" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.userGroup.deleteMany({ where: { userId: id } });
    await prisma.person.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    await audit({
      userId: req.user.sub,
      action: "ELIMINAR_USUARIO",
      module: "Usuarios",
      detail: `Eliminó usuario ${id}`,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando usuario" });
  }
});

export default router;
