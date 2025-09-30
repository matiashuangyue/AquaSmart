import { timeLabel } from "../domain/defaults";
import { apiSimulate } from "../infra/http/httpRepo.js";

// generador de lectura aleatoria "creíble"
function randomValues() {
  return {
    ph: +(6.5 + Math.random() * 2).toFixed(1),  // 6.5–8.5
    cl: +(0.1 + Math.random() * 2).toFixed(1),  // 0.1–2.1
    t:  +(22 + Math.random() * 10).toFixed(0),  // 22–32
  };
}

// si no hay datos, sembramos una base para el gráfico (solo client-side)
function seedHistory() {
  const base = [];
  const now = Date.now();
  let idx = 0;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now - i * 5 * 60 * 1000); // cada 5 min
    base.push({ idx: idx++, time: timeLabel(d), ph: 7.2, cl: 1.0, t: 28 });
  }
  base.push({ idx: idx++, time: timeLabel(), ph: 6.9, cl: 0.8, t: 28 });
  return base;
}

export function makeUsecases(readingsRepo, thresholdsRepo) {
  return {
    // ===== Lecturas / Historial =====
    async getHistory(poolId = "pool1") {
      let h = await readingsRepo.getHistory(poolId);
      if (!h?.length) {
        // En HTTP no hay setAll real; dejamos un seed local para que el gráfico no quede vacío
        const base = seedHistory();
        await readingsRepo.setAll?.(base, poolId);
        h = base;
      }
      return h;
    },

    // (Ya no usamos esto desde el botón; el Dashboard limpia sólo el gráfico)
    async clearHistory(poolId = "pool1") {
      const base = seedHistory();
      await readingsRepo.setAll?.(base, poolId);
      return base;
    },

    async simulateReading(poolId = "pool1") {
      // Intentar contra la API
      try {
        const r = await apiSimulate(poolId); // {idx,time,ph,cl,t}
        // Si tu repo soporta push local, lo actualizamos para que el gráfico avance sin re-fetch
        await readingsRepo.push?.(r, poolId);
        return r;
      } catch (e) {
        // Fallback local (por si la API no responde)
        const hist = await readingsRepo.getHistory(poolId);
        const idx = (hist?.at(-1)?.idx ?? -1) + 1;
        const vals = randomValues();
        const reading = {
          idx,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          ...vals,
        };
        await readingsRepo.push?.(reading, poolId);
        return reading;
      }
    },

    // ===== Umbrales =====
    loadThresholds: (poolId = "pool1") => thresholdsRepo.load(poolId),
    // t debe incluir { poolId, phMin, phMax, chlorMin, chlorMax, tempMin, tempMax }
    saveThresholds: (t) => thresholdsRepo.save(t),
  };
}
