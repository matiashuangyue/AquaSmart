import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";
import poolsRoutes from "./routes/pools.js";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// Helper: formato hora corta
const toHHMM = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Rutas de auth
app.use("/api/auth", authRoutes);

// Rutas de piletas
app.use("/api/pools", poolsRoutes);

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
        time: toHHMM(l.fechaHora),
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
app.post("/api/sim/run-once", async (req, res) => {
  try {
    const poolId = req.body?.poolId || "pool1";

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

    res.status(201).json({
      idx: 0,
      time: toHHMM(created.fechaHora),
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
app.get("/api/thresholds", async (req, res) => {
  try {
    const poolId = req.query.poolId || "pool1";
    const th = await prisma.threshold.findUnique({ where: { poolId } });
    res.json(th);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo umbrales" });
  }
});

app.put("/api/thresholds", async (req, res) => {
  try {
    const { poolId, phMin, phMax, chlorMin, chlorMax, tempMin, tempMax } =
      req.body;
    if (!poolId) return res.status(400).json({ error: "poolId requerido" });

    const up = await prisma.threshold.upsert({
      where: { poolId },
      update: { phMin, phMax, chlorMin, chlorMax, tempMin, tempMax },
      create: { poolId, phMin, phMax, chlorMin, chlorMax, tempMin, tempMax },
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
