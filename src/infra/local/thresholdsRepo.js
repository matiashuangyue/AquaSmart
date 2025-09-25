import { DEFAULT_THRESHOLDS } from "../../domain/defaults";

const KEY = "aquasmart.thresholds";

export const LocalThresholdsRepo = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  },
  async save(th) {
    localStorage.setItem(KEY, JSON.stringify(th));
  }
};
