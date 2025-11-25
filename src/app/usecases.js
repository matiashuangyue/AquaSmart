import { apiSimulate } from "../infra/http/httpRepo.js";

// generador de lectura aleatoria "creíble" (solo fallback local)
function randomValues() {
  return {
    ph: +(6.5 + Math.random() * 2).toFixed(1),
    cl: +(0.1 + Math.random() * 2).toFixed(1),
    t:  +(22 + Math.random() * 10).toFixed(0),
  };
}

export function makeUsecases(readingsRepo, thresholdsRepo) {
  return {
    // ===== Lecturas / Historial =====
    async getHistory(poolId = "pool1") {
      const h = await readingsRepo.getHistory(poolId);
      return h || [];
    },

    async clearHistory(poolId = "pool1") {
      const empty = [];
      await readingsRepo.setAll?.(empty, poolId);
      return empty;
    },

    async simulateReading(poolId = "pool1") {
      try {
        let r = await apiSimulate(poolId); // {idx,time,ph,cl,t}

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
        // fallback local si falla la API
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
