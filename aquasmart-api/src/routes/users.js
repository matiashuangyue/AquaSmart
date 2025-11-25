// src/routes/users.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middlewares/auth.js";
import { audit } from "../infra/logger.js";

const prisma = new PrismaClient();
const router = Router();

// Helper: mapear User -> DTO para el front
function toUserDto(u) {
  const firstGroup = u.groups?.[0]?.group?.name || "OWNER";
  return {
    id: u.id,
    email: u.person?.email || "",
    role: firstGroup,          // ADMIN | TECNICO | OWNER
    active: u.active,
    createdAt: u.createdAt,
  };
}

// helper para obtener (o crear) un Group por nombre
async function ensureGroupByName(name) {
  let g = await prisma.group.findUnique({ where: { name } });
  if (!g) {
    g = await prisma.group.create({
      data: { name, desc: `Grupo ${name}` },
    });
  }
  return g;
}

// GET /api/users  → lista de usuarios
router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        person: true,
        groups: {
          include: { group: true },
        },
      },
    });

    res.json(users.map(toUserDto));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
});

// POST /api/users → crear usuario desde gestión
router.post("/", requireAuth, async (req, res) => {
  try {
    const { email, role = "OWNER", active = true } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email obligatorio" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // username básico a partir del email
    let baseUsername = cleanEmail.split("@")[0];
    let username = baseUsername;
    let exists = await prisma.user.findUnique({ where: { username } });

    if (exists) {
      username = `${baseUsername}_${Date.now().toString(36).slice(-4)}`;
    }

    const passwordHash = await bcrypt.hash("Cambiar123!", 10); // contraseña por defecto

    const user = await prisma.user.create({
      data: {
        username,
        active,
        passwordHash,
        person: {
          create: {
            name: baseUsername,
            email: cleanEmail,
          },
        },
      },
      include: {
        person: true,
        groups: { include: { group: true } },
      },
    });

    // Asignar grupo/rol
    const group = await ensureGroupByName(role);
    await prisma.userGroup.create({
      data: {
        userId: user.id,
        groupId: group.id,
      },
    });

    // Recargar user con grupos
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        person: true,
        groups: { include: { group: true } },
      },
    });

    await audit({
      userId: req.user.sub,
      action: "CREAR_USUARIO",
      module: "Usuarios",
      detail: `Creó usuario ${cleanEmail} con rol ${role}`,
    });

    res.status(201).json(toUserDto(fullUser));
  } catch (e) {
    console.error(e);
    if (e.code === "P2002") {
      return res.status(409).json({ error: "Email ya registrado" });
    }
    res.status(500).json({ error: "Error creando usuario" });
  }
});

// PUT /api/users/:id → actualizar email/rol/activo
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, active } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { person: true, groups: { include: { group: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // actualizar email/persona
    if (email && email.trim()) {
      await prisma.person.update({
        where: { id: user.person.id },
        data: { email: email.trim().toLowerCase() },
      });
    }

    // actualizar activo
    if (typeof active === "boolean") {
      await prisma.user.update({
        where: { id },
        data: { active },
      });
    }

    // actualizar rol/grupo
    if (role) {
      const group = await ensureGroupByName(role);
      // borro asociaciones previas y pongo la nueva
      await prisma.userGroup.deleteMany({ where: { userId: id } });
      await prisma.userGroup.create({
        data: {
          userId: id,
          groupId: group.id,
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id },
      include: { person: true, groups: { include: { group: true } } },
    });

    await audit({
      userId: req.user.sub,
      action: "EDITAR_USUARIO",
      module: "Usuarios",
      detail: `Editó usuario ${fullUser.person?.email}`,
    });

    res.json(toUserDto(fullUser));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando usuario" });
  }
});

// DELETE /api/users/:id → marcamos como inactivo
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      include: { person: true },
    });

    await audit({
      userId: req.user.sub,
      action: "ELIMINAR_USUARIO",
      module: "Usuarios",
      detail: `Marcó como inactivo al usuario ${user.person?.email}`,
    });

    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error eliminando usuario" });
  }
});

export default router;

