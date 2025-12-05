import { toDomainThresholds, toApiThresholds } from "./mappers.js";
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

export const HttpThresholdsRepo = {
  async load(poolId) {
    if (!poolId) {
      // si no hay poolId, devolvemos null y el front usa defaults
      return null;
    }

    // endpoint por path param
    const r = await fetch(`${API}/api/thresholds/${poolId}`, {
      headers: headers(),
    });

    if (r.status === 404) {
      // no hay umbrales aún para esa pileta
      return null;
    }

    if (!r.ok) throw new Error("Thresholds error");

    const apiTh = await r.json();
    return toDomainThresholds(apiTh);
  },

  async save(domainTh, poolId) {
    if (!poolId) {
      throw new Error("poolId requerido para guardar umbrales");
    }

    const payload = toApiThresholds(domainTh, poolId);

    const r = await fetch(`${API}/api/thresholds/${poolId}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    if (!r.ok) throw new Error("Save thresholds error");

    const apiTh = await r.json();
    return toDomainThresholds(apiTh);
  },
};

// 👇 AHORA MANDA notifyMode TOMADO DE localStorage
export async function apiSimulate(poolId = "pool1") {
  let notifyMode = "NONE";
  try {
    const stored = localStorage.getItem("as_notifMode");
    if (stored) notifyMode = stored;
  } catch {
    // si falla localStorage, queda NONE
  }

  const r = await fetch(`${API}/api/sim/run-once`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ poolId, notifyMode }),
  });
  if (!r.ok) throw new Error("Simulate error");
  return r.json();
}
