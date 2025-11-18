const KEY = "aquasmart.history";

function normalizeReading(reading) {
  const r = { ...reading };

  // Si no hay time o no es una fecha válida, ponemos ahora en ISO
  const clean = r.time != null ? String(r.time).trim() : "";
  const parsed = Date.parse(clean);

  if (!clean || Number.isNaN(parsed)) {
    r.time = new Date().toISOString();
  } else {
    // si es parseable, usamos la fecha parseada (normalizada)
    r.time = new Date(parsed).toISOString();
  }

  return r;
}

export const LocalHistoryRepo = {
  async getHistory() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  },

  async push(reading) {
    const h = await this.getHistory();
    const fixed = normalizeReading(reading);      // 👈 normalizamos acá
    const arr = [...h, fixed].slice(-30);         // mantener últimas 30
    localStorage.setItem(KEY, JSON.stringify(arr));
  },

  async setAll(arr) {
    const fixed = (arr || []).map(normalizeReading); // 👈 y acá también
    localStorage.setItem(KEY, JSON.stringify(fixed));
  },

  async clear() {
    localStorage.removeItem(KEY);
  }
};
