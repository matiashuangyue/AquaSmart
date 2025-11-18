export const DEFAULT_THRESHOLDS = { 
  ph: { min: 7.2, max: 7.8 },
  cl: { min: 0.5, max: 1.5 },
  t:  { min: 20,  max: 35  },
};

export const timeLabel = (d = new Date()) =>
  d.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
// Ej: 19/11/25 16:10
