import { toDomainThresholds, toApiThresholds } from "./mappers.js";

const API = import.meta.env.VITE_API_URL;

const headers = () => {
  const h = { "Content-Type": "application/json" };
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
  async load(poolId = "pool1") {
    const r = await fetch(`${API}/api/thresholds?poolId=${poolId}`, {
      headers: headers(),
    });
    if (!r.ok) throw new Error("Thresholds error");
    const apiTh = await r.json();   // { phMin, phMax, chlorMin, ... }
    return toDomainThresholds(apiTh); // -> { ph:{min,max}, cl:{...}, t:{...} }
  },
  async save(domainTh, poolId = "pool1") {
    const payload = toApiThresholds(domainTh, poolId);
    const r = await fetch(`${API}/api/thresholds`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("Save thresholds error");
    const apiTh = await r.json();
    return toDomainThresholds(apiTh);
  },
};

// Simulación desde API
export async function apiSimulate(poolId = "pool1") {
  const r = await fetch(`${API}/api/sim/run-once`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ poolId }),   // 👈 ESTE poolId
  });
  if (!r.ok) throw new Error("Simulate error");
  return r.json();
}

