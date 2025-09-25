// Devuelve "ok" | "warn" | "danger" según umbral
export function evaluate(value, { min, max }) {
    if (value < min || value > max) return "danger";
    const r = max - min;
    return (value < min + r * 0.07 || value > max - r * 0.07) ? "warn" : "ok";
  }
  