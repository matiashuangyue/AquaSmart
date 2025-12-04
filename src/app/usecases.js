// src/app/usecases.js
import { apiSimulate } from "../infra/http/httpRepo.js";

// generador de lectura aleatoria "creíble" (solo fallback local)
function randomValues() {
  return {
    ph: +(6.5 + Math.random() * 2).toFixed(1),
    cl: +(0.1 + Math.random() * 2).toFixed(1),
    t: +(22 + Math.random() * 10).toFixed(0),
  };
}

export function makeUsecases(readingsRepo, thresholdsRepo) {
  return {
    // ===== Lecturas / Historial =====
    async getHistory(poolId) {
      const id = poolId || "pool1";
      const h = await readingsRepo.getHistory(id);
      return h || [];
    },

    async clearHistory(poolId) {
      const id = poolId || "pool1";
      const empty = [];
      await readingsRepo.setAll?.(empty, id);
      return empty;
    },

    async simulateReading(poolId) {
      const id = poolId || "pool1";

      try {
        let r = await apiSimulate(id); // {idx,time,ph,cl,t}

        const parsed = Date.parse(r.time);
        if (!r.time || Number.isNaN(parsed)) {
          r = {
            ...r,
            time: new Date().toISOString(),
          };
        }

        await readingsRepo.push?.(r, id);
        return r;
      } catch (e) {
        // fallback local si falla la API
        const hist = await readingsRepo.getHistory(id);
        const idx = (hist?.at(-1)?.idx ?? -1) + 1;
        const vals = randomValues();
        const reading = {
          idx,
          time: new Date().toISOString(),
          ...vals,
        };
        await readingsRepo.push?.(reading, id);
        return reading;
      }
    },

    // ===== Umbrales =====

    // Cargar umbrales de una pileta
    async loadThresholds(poolId) {
      if (!poolId) return null;
      return thresholdsRepo.load(poolId);
    },

    // Guardar umbrales
    // payload: { poolId, ph: {min,max}, cl: {...}, t: {...} }
    async saveThresholds(payload) {
      const { poolId, ph, cl, t } = payload || {};
      if (!poolId) {
        throw new Error("poolId requerido para guardar umbrales");
      }

      const domainTh = { ph, cl, t }; // lo que espera HttpThresholdsRepo
      return thresholdsRepo.save(domainTh, poolId);
    },
  };
}
