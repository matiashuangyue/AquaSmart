import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";
import poolsRoutes from "./routes/pools.js";
import auditRoutes from "./routes/audit.js";
import usersRoutes from "./routes/users.js";
import groupsRoutes from "./routes/groups.js";
import permissionsRouter from "./routes/permissions.js";
import thresholdsRouter from "./routes/thresholds.js";
import { requireAuth } from "./middlewares/auth.js";
import { audit } from "./infra/logger.js";
import { sendAlertMail } from "./infra/mailer.js"; // 👈 NUEVO

const prisma = new PrismaClient();
const app = express();

// Helper: resolver poolId lógico ("pool1") al real de BD del usuario
async function resolvePoolId(req, poolIdFromClient) {
  // Si ya viene uno real distinto de "pool1", lo usamos tal cual
  if (poolIdFromClient && poolIdFromClient !== "pool1") {
    return poolIdFromClient;
  }

  // Si no hay usuario (no pasó por requireAuth), devolvemos lo que haya
  const userId = req.user?.sub;
  if (!userId) {
    return poolIdFromClient || "pool1";
  }

  // Buscamos la primera pileta del usuario como "principal"
  const pool = await prisma.pool.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });

  return pool?.id || poolIdFromClient || "pool1";
}

app.use(cors());
app.use(express.json());

// Helper: formato hora corta
const toHHMM = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// 👇 NUEVO: memoria simple para limitar frecuencia de mails
const lastAlertMap = new Map();
/**
 * key = `${userId}:${poolId}:${mode}`
 * value = timestamp (ms)
 */
function shouldSendAlert(userId, poolId, mode) {
  if (!mode || mode === "NONE") return false;
  if (mode === "EACH") return true; // siempre

  const key = `${userId}:${poolId}:${mode}`;
  const now = Date.now();
  const last = lastAlertMap.get(key) || 0;

  let minDiffMs = 0;
  if (mode === "EVERY_5_MIN") {
    minDiffMs = 5 * 60 * 1000;
  } else if (mode === "DAILY") {
    minDiffMs = 24 * 60 * 60 * 1000;
  } else {
    // modo desconocido -> no enviar
    return false;
  }

  if (now - last >= minDiffMs) {
    lastAlertMap.set(key, now);
    return true;
  }
  return false;
}

// Rutas de auth
app.use("/api/auth", authRoutes);

// Rutas de piletas
app.use("/api/pools", poolsRoutes);

// Rutas de auditoría
app.use("/api/audit", auditRoutes);

// Rutas de usuarios
app.use("/api/users", usersRoutes);

// Rutas de grupos
app.use("/api/groups", groupsRoutes);

// Rutas de permisos
app.use("/api/permissions", permissionsRouter);

// Rutas de umbrales
app.use("/api/thresholds", thresholdsRouter);
// ===============================
//   MEDICIONES / SIMULACIÓN
// ===============================

// GET último valor (usa SensorLectura + Parametro)
app.get("/api/measurements/latest", async (req, res) => {
  try {
    const poolId = req.query.poolId || "pool1";

    const lectura = await prisma.sensorLectura.findFirst({
      where: { poolId },
      orderBy: { fechaHora: "desc" },
      include: { parametros: true },
    });

    if (!lectura) {
      return res.json(null);
    }

    const getVal = (tipo) =>
      lectura.parametros.find((p) => p.tipo === tipo)?.valor ?? null;

    res.json({
      poolId,
      takenAt: lectura.fechaHora,
      ph: getVal("ph"),
      freeChlor: getVal("cloro"),
      tempC: getVal("temperatura"),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo última medición" });
  }
});

// GET historial (devuelve [{idx,time,ph,cl,t}, ...] como antes)
app.get("/api/measurements/history", async (req, res) => {
  try {
    const poolId = req.query.poolId || "pool1";

    const lecturas = await prisma.sensorLectura.findMany({
      where: { poolId },
      orderBy: { fechaHora: "asc" },
      include: { parametros: true },
    });

    const data = lecturas.map((l, i) => {
      const getVal = (tipo) =>
        l.parametros.find((p) => p.tipo === tipo)?.valor ?? null;

      return {
        idx: i,
        // 👉 Enviamos fecha/hora completa en ISO
        time: l.fechaHora.toISOString(),
        ph: getVal("ph"),
        cl: getVal("cloro"),
        t: getVal("temperatura"),
      };
    });

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo historial" });
  }
});

// POST simular una medición (crea SensorLectura + Parámetros)
app.post("/api/sim/run-once", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const poolIdRaw = req.body?.poolId || "pool1";
    const notifyMode = req.body?.notifyMode || "NONE"; // 👈 NUEVO
    const poolId = await resolvePoolId(req, poolIdRaw);

    const ph = +(6.5 + Math.random() * 2).toFixed(1);
    const cl = +(0.1 + Math.random() * 2).toFixed(1);
    const t = +(22 + Math.random() * 10).toFixed(0);

    const created = await prisma.sensorLectura.create({
      data: {
        poolId,
        parametros: {
          create: [
            { tipo: "ph", unidad: "pH", valor: ph },
            { tipo: "cloro", unidad: "ppm", valor: cl },
            { tipo: "temperatura", unidad: "°C", valor: t },
          ],
        },
      },
      include: { parametros: true },
    });

    // buscamos la pileta para mostrar el nombre en el detalle
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    await audit({
      userId,
      action: "SIMULAR_LECTURA",
      module: "Sensores",
      detail: pool
        ? `Lectura simulada en pileta ${pool.name}`
        : `Lectura simulada en una pileta`,
      poolId,
    });

    // 👉 NUEVO: evaluación simple de umbrales + envío de mail
    if (notifyMode && notifyMode !== "NONE") {
      // obtenemos email del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { person: true },
      });

      // umbrales de la pileta
      const th = await prisma.threshold.findUnique({
        where: { poolId },
      });

      if (user?.person?.email && th) {
        const alerts = [];

        if (ph < th.phMin || ph > th.phMax) {
          alerts.push(
            `pH fuera de rango: ${ph} (umbral ${th.phMin} – ${th.phMax})`
          );
        }
        if (cl < th.chlorMin || cl > th.chlorMax) {
          alerts.push(
            `Cloro libre fuera de rango: ${cl} ppm (umbral ${th.chlorMin} – ${th.chlorMax} ppm)`
          );
        }
        if (t < th.tempMin || t > th.tempMax) {
          alerts.push(
            `Temperatura fuera de rango: ${t} °C (umbral ${th.tempMin} – ${th.tempMax} °C)`
          );
        }

        if (alerts.length > 0 && shouldSendAlert(userId, poolId, notifyMode)) {
          try {
            await sendAlertMail({
              to: user.person.email,
              poolName: pool?.name || poolId,
              values: { ph, cl, t },
              thresholds: th,
              alerts,
              mode: notifyMode,
            });
          } catch (mailErr) {
            console.error("Error enviando mail de alerta:", mailErr);
          }
        }
      }
    }

    res.status(201).json({
      idx: created.fechaHora.getTime(), // índice único
      time: created.fechaHora.toISOString(),
      ph,
      cl,
      t,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error simulando medición" });
  }
});

// ===============================
//   UMBRALES
// ===============================
app.get("/api/thresholds", requireAuth, async (req, res) => {
  try {
    const poolIdRaw = req.query.poolId || "pool1";
    const poolId = await resolvePoolId(req, poolIdRaw);

    const th = await prisma.threshold.findUnique({ where: { poolId } });
    res.json(th);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo umbrales" });
  }
});

// PUT actualizar umbrales
app.put("/api/thresholds", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { poolId, phMin, phMax, chlorMin, chlorMax, tempMin, tempMax } =
      req.body;

    if (!poolId) {
      return res.status(400).json({ error: "poolId requerido" });
    }

    const up = await prisma.threshold.upsert({
      where: { poolId },
      update: { phMin, phMax, chlorMin, chlorMax, tempMin, tempMax },
      create: { poolId, phMin, phMax, chlorMin, chlorMax, tempMin, tempMax },
    });

    // buscar nombre de pileta
    const pool = await prisma.pool.findUnique({ where: { id: poolId } });

    await audit({
      userId,
      action: "EDITAR_UMBRAL",
      module: "Umbrales",
      detail: pool
        ? `Actualizó umbrales de la pileta "${pool.name}"`
        : `Actualizó umbrales de una pileta`,
      poolId,
    });

    res.json(up);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error guardando umbrales" });
  }
});

// ===============================

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send(
    "AquaSmart API ok. Usá /api/measurements/history, /api/measurements/latest, /api/thresholds"
  );
});

app.listen(PORT, () => {
  console.log(`✅ API lista en http://localhost:${PORT}`);
});
