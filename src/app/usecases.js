import { timeLabel } from "../domain/defaults";
import { apiSimulate } from "../infra/http/httpRepo.js";


// generador de lectura aleatoria "creíble"
function randomValues() {
  return {
    ph: +(6.5 + Math.random()*2).toFixed(1),  // 6.5–8.5
    cl: +(0.1 + Math.random()*2).toFixed(1),  // 0.1–2.1
    t:  +(22 + Math.random()*10).toFixed(0),  // 22–32
  };
}

// si no hay datos, sembramos una base para el gráfico
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
    // Datos
    async getHistory() {
      let h = await readingsRepo.getHistory();
      if (!h.length) {
        await readingsRepo.setAll(seedHistory());
        h = await readingsRepo.getHistory();
      }
      return h;
    },
    async clearHistory() {
      await readingsRepo.setAll(seedHistory());
      return readingsRepo.getHistory();
    },
    async simulateReading() {
        // Intentar contra la API
        try {
          const r = await apiSimulate("pool1"); // {idx,time,ph,cl,t}
          return r;
        } catch (e) {
          // Fallback local (por si la API no responde)
          const hist = await readingsRepo.getHistory();
          const idx = (hist.at(-1)?.idx ?? -1) + 1;
          const vals = {
            ph: +(6.5 + Math.random() * 2).toFixed(1),
            cl: +(0.1 + Math.random() * 2).toFixed(1),
            t:  +(22 + Math.random() * 10).toFixed(0),
          };
          const reading = { idx, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ...vals };
          await readingsRepo.push?.(reading);
          return reading;
        }
      }
      ,

    // Umbrales
    loadThresholds: () => thresholdsRepo.load(),
    saveThresholds: (t) => thresholdsRepo.save(t),
  };
}
