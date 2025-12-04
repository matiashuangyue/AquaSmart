// src/infra/http/httpRepo.js
import { toDomainThresholds } from "./mappers.js";
import { getToken } from "../../lib/session";

const API = import.meta.env.VITE_API_URL;

const headers = () => {
  const h = { "Content-Type": "application/json" };

  // 👉 TOKEN JWT
  const token = getToken();
  if (token) {
    h["Authorization"] = `Bearer ${token}`;
  }

  // 👉 API KEY opcional
  const key = import.meta.env.VITE_API_KEY;
  if (key) h["x-api-key"] = key;

  return h;
};

// =====================
//   HISTORIAL
// =====================
export const HttpHistoryRepo = {
  async getHistory(poolId = "pool1") {
    const r = await fetch(`${API}/api/measurements/history?poolId=${poolId}`, {
      headers: headers(),
    });
    if (!r.ok) throw new Error("History error");
    return r.json(); // [{idx,time,ph,cl,t}, ...]
  },
  async setAll() {},
  async push() {},
};

// =====================
//   UMBRALES
// =====================
export const HttpThresholdsRepo = {
  async load(poolId) {
    if (!poolId) {
      // si no hay poolId, devolvemos null y el front usa defaults/fallback
      return null;
    }

    // usamos /api/thresholds/:poolId (router nuevo)
    const r = await fetch(`${API}/api/thresholds/${poolId}`, {
      headers: headers(),
    });

    if (r.status === 404) {
      // no hay umbrales aún para esa pileta
      return null;
    }

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      console.error("Error HttpThresholdsRepo.load", r.status, txt);
      throw new Error("Thresholds error");
    }

    const apiTh = await r.json();
    // el backend devuelve { phMin, phMax, chlorMin, ... }
    return toDomainThresholds(apiTh);
  },

  async save(domainTh, poolId) {
    if (!poolId) {
      throw new Error("poolId requerido para guardar umbrales");
    }

    // ⚠️ Armamos EXACTAMENTE lo que espera tu router de /api/thresholds/:poolId
    const body = {
      phMin: domainTh.ph.min,
      phMax: domainTh.ph.max,
      chlorMin: domainTh.cl.min,
      chlorMax: domainTh.cl.max,
      tempMin: domainTh.t.min,
      tempMax: domainTh.t.max,
    };

    const r = await fetch(`${API}/api/thresholds/${poolId}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    const txt = await r.text().catch(() => "");

    if (!r.ok) {
      console.error("Error HttpThresholdsRepo.save", r.status, txt);
      let msg = "Save thresholds error";
      try {
        const json = JSON.parse(txt);
        if (json.error) msg = json.error;
      } catch {
        // ignore parse error
      }
      throw new Error(msg);
    }

    // si tu router devuelve el registro de Threshold, lo mapeamos a dominio
    if (!txt) return null;
    const apiTh = JSON.parse(txt);
    return toDomainThresholds(apiTh);
  },
};

// =====================
//   SIMULACIÓN
// =====================
export async function apiSimulate(poolId = "pool1") {
  const r = await fetch(`${API}/api/sim/run-once`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ poolId }),
  });
  if (!r.ok) throw new Error("Simulate error");
  return r.json();
}
