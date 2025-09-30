import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// Helper: formato hora
const toHHMM = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Middleware API Key
app.use("/api/auth", authRoutes);

// GET último valor
app.get("/api/measurements/latest", async (req, res) => {
  const poolId = req.query.poolId || "pool1";
  const m = await prisma.measurement.findFirst({
    where: { poolId },
    orderBy: { takenAt: "desc" }
  });
  res.json(m);
});

// GET historial
app.get("/api/measurements/history", async (req, res) => {
  const poolId = req.query.poolId || "pool1";
  const list = await prisma.measurement.findMany({
    where: { poolId },
    orderBy: { takenAt: "asc" }
  });
  res.json(list.map((m, i) => ({
    idx: i, time: toHHMM(m.takenAt), ph: m.ph, cl: m.freeChlor, t: m.tempC
  })));
});

// POST simular una medición
app.post("/api/sim/run-once", async (req, res) => {
  const poolId = req.body?.poolId || "pool1";
  const ph = +(6.5 + Math.random() * 2).toFixed(1);
  const cl = +(0.1 + Math.random() * 2).toFixed(1);
  const t = +(22 + Math.random() * 10).toFixed(0);

  const created = await prisma.measurement.create({
    data: { poolId, ph, freeChlor: cl, tempC: t }
  });

  res.status(201).json({
    idx: 0, time: toHHMM(created.takenAt), ph, cl, t
  });
});

// GET umbrales
app.get("/api/thresholds", async (req, res) => {
  const poolId = req.query.poolId || "pool1";
  const th = await prisma.threshold.findUnique({ where: { poolId } });
  res.json(th);
});

// PUT actualizar umbrales
app.put("/api/thresholds", async (req, res) => {
  const poolId = req.body.poolId || "pool1";
  const { phMin, phMax, chlorMin, chlorMax, tempMin, tempMax } = req.body;
  const th = await prisma.threshold.upsert({
    where: { poolId },
    update: { phMin, phMax, chlorMin, chlorMax, tempMin, tempMax },
    create: { poolId, phMin, phMax, chlorMin, chlorMax, tempMin, tempMax }
  });
  res.json(th);
});

const PORT = process.env.PORT || 8080;
app.get("/", (req, res) => {
    res.send('AquaSmart API ok. Usá /api/measurements/history, /api/measurements/latest, /api/thresholds');
  });
  
app.listen(PORT, () => {
  console.log(`✅ API lista en http://localhost:${PORT}`);
});
