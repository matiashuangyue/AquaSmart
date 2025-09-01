import { genLatest, genHistory } from "./mockData";

// Simula endpoints. Luego reemplazá por Axios a tu backend.
export async function getLatestReadings() {
  await delay(200);
  return genLatest();
}

export async function getHistory({ limit = 24 } = {}) {
  await delay(200);
  return genHistory(limit);
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
