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


    res.status(201).json({
      idx: created.fechaHora.getTime(),          // índice único
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

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send(
    "AquaSmart API ok. Usá /api/measurements/history, /api/measurements/latest, /api/thresholds"
  );
});

app.listen(PORT, () => {
  console.log(`✅ API lista en http://localhost:${PORT}`);
});
