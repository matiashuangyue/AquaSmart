const KEY = "aquasmart.history";

export const LocalHistoryRepo = {
  async getHistory() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  },
  async push(reading) {
    const h = await this.getHistory();
    const arr = [...h, reading].slice(-30); // ventana máx 30
    localStorage.setItem(KEY, JSON.stringify(arr));
  },
  async setAll(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr || []));
  },
  async clear() {
    localStorage.removeItem(KEY);
  }
};
