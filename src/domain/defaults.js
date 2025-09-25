export const DEFAULT_THRESHOLDS = {
    ph: { min: 7.2, max: 7.8 },
    cl: { min: 0.5, max: 1.5 },
    t:  { min: 20,  max: 35  },
  };
  export const timeLabel = (d = new Date()) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  