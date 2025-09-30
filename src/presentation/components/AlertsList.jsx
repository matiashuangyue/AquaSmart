export default function AlertsList({ latest, status, thresholds }) {
  const items = [];
  if (!latest) return null;

  if (status.ph === "danger") {
    items.push({
      k: "pH",
      value: latest.ph,
      range: `${thresholds.ph.min} – ${thresholds.ph.max}`,
    });
  }
  if (status.cl === "danger") {
    items.push({
      k: "Cloro libre",
      value: latest.cl,
      range: `${thresholds.cl.min} – ${thresholds.cl.max}`,
    });
  }
  if (status.t === "danger") {
  items.push({
    k: "Temperatura",
    value: latest.t,
    range: `${thresholds.t.min} – ${thresholds.t.max}`,
  });
}


  return (
    <div className="card">
      <h3 className="font-semibold text-slate-800 mb-3">Alertas</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Sin alertas críticas por ahora.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-medium text-red-700">{it.k} fuera de rango</span>
                <span className="text-red-700"> · valor: {it.value}</span>
              </div>
              <span className="text-xs text-red-600">
                Rango configurado: {it.range}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
