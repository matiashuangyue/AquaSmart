import { useEffect, useState } from "react";
import { Thermometer, Droplets, FlaskConical, Trash2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import StatCard from "../components/StatCard";
import AlertsPanel from "../components/AlertsPanel";
import ActionConfirm from "../components/ActionConfirm";
import { usecases } from "../../composition/container";
import { DEFAULT_THRESHOLDS } from "../../domain/defaults";
import { evaluate } from "../../domain/evaluate";

export default function Dashboard({ thVersion = 0 }) {  // 👈 recibe prop
  const [th, setTh] = useState(DEFAULT_THRESHOLDS);
  const [history, setHistory] = useState([]);
  const [data, setData] = useState({ ph: 6.9, cl: 0.8, t: 28 });

  useEffect(() => {
    (async () => {
      const [h, tload] = await Promise.all([
        usecases.getHistory("pool1"),
        usecases.loadThresholds("pool1"),
      ]);
      setHistory(h);
      setTh(tload);
      const last = h.at(-1);
      if (last) setData({ ph: last.ph, cl: last.cl, t: last.t });
      // Debug opcional:
      // console.log("[Dashboard] th cargado:", tload);
    })();
  }, [thVersion]); // 👈 vuelve a cargar al guardar en Config


  const hasTh = th && th.ph && th.cl && th.t;
  const s = hasTh ? {
    ph: evaluate(data.ph, th.ph),
    cl: evaluate(data.cl, th.cl),
    t:  evaluate(data.t,  th.t),
  } : { ph: "ok", cl: "ok", t: "ok" };

  const alerts = [
  ...(s.ph !== "ok" ? [{
    type: s.ph === "danger" ? "danger" : "warn",
    title: s.ph === "danger" ? "pH crítico" : "pH fuera de rango",
    msg: `pH: ${data.ph}. ${s.ph === "danger" ? "Agregue regulador alcalino." : "Revise y ajuste pH."}`,
    time: history.at(-1)?.time || ""
  }] : []),

  ...(s.cl !== "ok" ? [{
    type: s.cl === "danger" ? "danger" : "warn",
    title: s.cl === "danger" ? "Nivel de cloro crítico" : "Cloro fuera de rango",
    msg: `Cloro libre: ${data.cl} ppm. ${s.cl === "danger" ? "Agregue cloro." : "Revise y ajuste cloro."}`,
    time: history.at(-1)?.time || ""
  }] : []),

  ...(s.t !== "ok" ? [{
    type: s.t === "danger" ? "danger" : "warn",
    title: s.t === "danger" ? "Temperatura crítica" : "Temperatura fuera de rango",
    msg: `Temperatura: ${data.t} °C. ${s.t === "danger" ? "Revise urgentemente la climatización." : "Ajuste el control de temperatura."}`,
    time: history.at(-1)?.time || ""
  }] : []),
];

  async function simulate() {
    const r = await usecases.simulateReading();
    setData({ ph: r.ph, cl: r.cl, t: r.t });
    setHistory(h => [...h, { idx: r.idx, time: r.time, ph: r.ph, cl: r.cl, t: r.t }]);
  }

  function clearChart() {
    // Limpia solo la serie del gráfico (no toca tarjetas ni BD)
    setHistory([]);
  }

 const ranges = th && th.ph && th.cl && th.t ? {
  ph: `Rango configurado: ${th.ph.min} – ${th.ph.max}`,
  cl: `Rango configurado: ${th.cl.min} – ${th.cl.max} ppm`,
  t:  `Rango configurado: ${th.t.min} – ${th.t.max} °C`,
} : {
  ph: "Rango configurado: (no definido)",
  cl: "Rango configurado: (no definido)",
  t:  "Rango configurado: (no definido)",
};

const rangesNormal = {
  ph: "Rango normal: 7.2 – 7.8",
  cl: "Rango normal: 0.5 – 1.5 ppm",
  t:  "Rango normal: 20 – 35 °C",
};

  return (
    <div className="space-y-5">
      {/* Controles */}
      <div className="flex justify-end gap-2">
        {/* antes: clearHistory */}
        <button
          onClick={clearChart}
          className="flex items-center gap-2 border px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
        >
          <Trash2 className="w-4 h-4" /> Limpiar gráfico {/* antes: Borrar historial */}
        </button>
        <button
          onClick={simulate}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm font-medium"
        >
          Simular lectura
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <StatCard
    title="Nivel de pH"
    value={data.ph}
    unit=""
    range={`${ranges.ph}\n${rangesNormal.ph}`}   // 👈 dos líneas
    state={s.ph}
    icon={FlaskConical}
  />
  <StatCard
    title="Cloro Libre"
    value={data.cl}
    unit="ppm"
    range={`${ranges.cl}\n${rangesNormal.cl}`}
    state={s.cl}
    icon={Droplets}
  />
  <StatCard
    title="Temperatura"
    value={data.t}
    unit="°C"
    range={`${ranges.t}\n${rangesNormal.t}`}
    state={s.t}
    icon={Thermometer}
  />
</div>


      {/* Gráfico pH vs tiempo (único bloque, condicional) */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Evolución de pH</h3>
          <span className="text-xs text-slate-500">Se actualiza al simular</span>
        </div>

        {history.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-500">
            Gráfico vacío. Usa “Simular lectura” o recargá la página.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="idx"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => {
                    const p = history.find(d => d.idx === v);
                    return p ? p.time : "";
                  }}
                />
                <YAxis domain={[6.5, 8.5]} tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(v) => {
                    const p = history.find(d => d.idx === v);
                    return p ? p.time : v;
                  }}
                />
                <Line type="monotone" dataKey="ph" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Paneles inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertsPanel alerts={alerts} />
        <ActionConfirm onConfirm={(text) => {
          console.log("Acción correctiva registrada:", text);
          // opcional: enviar a backend
          // fetch(`${API}/api/actions`, { method:"POST", body: JSON.stringify({poolId:"pool1", text}) })
        }} />
      </div>

    </div>
  );
}
