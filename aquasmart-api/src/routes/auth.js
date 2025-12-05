import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middlewares/auth.js";
import { audit } from "../infra/logger.js";
import { sendPasswordResetMail } from "../infra/mailer.js";

const prisma = new PrismaClient();
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES = "7d";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

function sign(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    include: {
      person: true,
      groups: {
        include: {
          group: {
            include: {
              perms: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const groups = user.groups.map((ug) => ({
    id: ug.group.id,
    name: ug.group.name,
    desc: ug.group.desc,
  }));

  const permSet = new Set();
  for (const ug of user.groups) {
    for (const gp of ug.group.perms) {
      if (gp.permission?.code) {
        permSet.add(gp.permission.code);
      }
    }
  }
  const permissions = Array.from(permSet);

  res.json({
    id: user.id,
    username: user.username,
    name: user.person?.name,
    email: user.person?.email,
    groups,
    permissions,
  });
});

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password)
      return res.status(400).json({ error: "Faltan campos" });

    const existsEmail = await prisma.person.findUnique({ where: { email } });
    const existsUser  = await prisma.user.findUnique({ where: { username } });
    if (existsEmail) return res.status(409).json({ error: "Email ya registrado" });
    if (existsUser)  return res.status(409).json({ error: "Usuario ya existe" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        active: true,
        passwordHash,
        person: { create: { name, email } }
      },
      include: { person: true }
    });

    await audit({
      userId: user.id,
      action: "SIGNUP",
      module: "Auth",
      detail: `Usuario creado (${username})`,
      poolId: null,
    });

    await prisma.pool.create({ data: { name: "Piscina Principal", ownerId: user.id } });

    const token = sign(user);
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, name: user.person?.name, email: user.person?.email }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password)
      return res.status(400).json({ error: "Faltan credenciales" });

    let user = await prisma.user.findUnique({ where: { username: emailOrUsername }, include: { person: true } });
    if (!user) {
      const person = await prisma.person.findUnique({ where: { email: emailOrUsername }, include: { user: true } });
      if (person) {
        user = await prisma.user.findUnique({ where: { id: person.user.id }, include: { person: true } });
      }
    }
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = sign(user);

    await audit({
      userId: user.id,
      action: "LOGIN",
      module: "Auth",
      detail: "Inicio de sesión",
      poolId: null,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.person?.name,
        email: user.person?.email
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
      return res.status(400).json({ error: "Email o usuario requerido" });
    }

    const genericResponse = {
      message: "Si la cuenta existe, te enviaremos un email con instrucciones.",
    };

    let user = await prisma.user.findUnique({
      where: { username: emailOrUsername },
      include: { person: true },
    });

    if (!user) {
      const person = await prisma.person.findUnique({
        where: { email: emailOrUsername },
        include: { user: true },
      });
      if (person?.user) {
        user = await prisma.user.findUnique({
          where: { id: person.user.id },
          include: { person: true },
        });
      }
    }

    if (!user || !user.person?.email) {
      return res.json(genericResponse);
    }

    const resetToken = jwt.sign(
      { sub: user.id, type: "reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${APP_URL}/reset-password?token=${encodeURIComponent(
      resetToken
    )}`;

    try {
      await sendPasswordResetMail(user.person.email, resetLink);
    } catch (err) {
      console.error("Error enviando mail de reset:", err);
    }

    await audit({
      userId: user.id,
      action: "FORGOT_PASSWORD",
      module: "Auth",
      detail: `Solicitud de restablecimiento de contraseña`,
      poolId: null,
    });

    return res.json(genericResponse);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error procesando la solicitud" });
  }
});

// ⭐️ NUEVO: POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token y nueva contraseña requeridos" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.type !== "reset") {
      return res.status(400).json({ error: "Token inválido" });
    }

    const userId = payload.sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await audit({
      userId,
      action: "RESET_PASSWORD",
      module: "Auth",
      detail: "Contraseña restablecida mediante token",
      poolId: null,
    });

    return res.json({ message: "Contraseña actualizada correctamente." });
  } catch (e) {
    console.error(e);
    if (e.name === "TokenExpiredError") {
      return res.status(400).json({ error: "El enlace de recuperación expiró. Pedí uno nuevo." });
    }
    return res.status(400).json({ error: "Token inválido o error al restablecer contraseña." });
  }
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    await audit({
      userId,
      action: "LOGOUT",
      module: "Auth",
      detail: "Cierre de sesión",
      poolId: null,
    });

    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error registrando logout" });
  }
});

export default router;
