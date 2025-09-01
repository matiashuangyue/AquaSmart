function rand(min, max, decimals = 2) {
  const n = Math.random() * (max - min) + min;
  return parseFloat(n.toFixed(decimals));
}

export function genLatest() {
  return {
    time: new Date().toISOString(),
    ph: rand(7.0, 8.1),
    cloro: rand(0.2, 1.8),
    temp: rand(18, 37, 1),
  };
}

export function genHistory(points = 24) {
  const data = [];
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now - i * 60 * 60 * 1000); // cada hora
    data.push({
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ph: 7.2 + Math.sin(i / 3) * 0.3 + (Math.random() - 0.5) * 0.1,
    });
  }
  return data;
}
