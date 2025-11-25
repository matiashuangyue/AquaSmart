import { timeLabel } from "../domain/defaults";
import { apiSimulate } from "../infra/http/httpRepo.js";

// generador de lectura aleatoria "creíble"
function randomValues() {
  return {
    ph: +(6.5 + Math.random() * 2).toFixed(1),
    cl: +(0.1 + Math.random() * 2).toFixed(1),
    t:  +(22 + Math.random() * 10).toFixed(0),
  };
}

// si no hay datos, sembramos una base para el gráfico
function seedHistory() {
  const base = [];
  const now = Date.now();
  let idx = 0;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now - i * 5 * 60 * 1000);
    base.push({
      idx: idx++,
      time: d.toISOString(),
      ph: 7.2,
      cl: 1.0,
      t: 28,
    });
  }
  const dNow = new Date();
  base.push({
    idx: idx++,
    time: dNow.toISOString(),
    ph: 6.9,
    cl: 0.8,
    t: 28,
  });
  return base;
}

export function makeUsecases(readingsRepo, thresholdsRepo) {
  return {
    // ===== Lecturas / Historial =====
    async getHistory(poolId = "pool1") {
      let h = await readingsRepo.getHistory(poolId);
      if (!h?.length) {
        const base = seedHistory();
        await readingsRepo.setAll?.(base, poolId);
        h = base;
      }
      return h;
    },

    async clearHistory(poolId = "pool1") {
      const base = seedHistory();
      await readingsRepo.setAll?.(base, poolId);
      return base;
    },

    async simulateReading(poolId = "pool1") {
      try {
        let r = await apiSimulate(poolId);

        // Normalizar fecha
        const parsed = Date.parse(r.time);
        if (!r.time || Number.isNaN(parsed)) {
          r = {
            ...r,
            time: new Date().toISOString(),
          };
        }

        await readingsRepo.push?.(r, poolId);
        return r;
      } catch (e) {
        const hist = await readingsRepo.getHistory(poolId);
        const idx = (hist?.at(-1)?.idx ?? -1) + 1;
        const vals = randomValues();
        const reading = {
          idx,
          time: new Date().toISOString(),
          ...vals,
        };
        await readingsRepo.push?.(reading, poolId);
        return reading;
      }
    },

    // ===== Umbrales =====
    loadThresholds: (poolId = "pool1") => thresholdsRepo.load(poolId),

    saveThresholds: (t, poolId = "pool1") => thresholdsRepo.save(t, poolId),
  };
}
