import { useEffect, useState } from "react";
import { Thermometer, Droplets, FlaskConical, Trash2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import StatCard from "../components/StatCard";
import AlertsPanel from "../components/AlertsPanel";
import ActionConfirm from "../components/ActionConfirm";

const TH = {
  ph: { min: 7.2, max: 7.8 },
  cl: { min: 0.5, max: 1.5 },
  t:  { min: 20,  max: 35  },
};

const LS_KEY = "aquasmart.history.ph";

function evalState(val, {min,max}) {
  if (val < min || val > max) return "danger";
  const r=max-min;
  if (val < min + r*0.07 || val > max - r*0.07) return "warn";
  return "ok";
}

function randomData() {
  return {
    ph: +(6.5 + Math.random()*2).toFixed(1),
    cl: +(0.1 + Math.random()*2).toFixed(1),
    t:  +(22 + Math.random()*10).toFixed(0),
  };
}

const timeLabel = (d = new Date()) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function seedHistory() {
  const base = [];
  const now = Date.now();
  let idx = 0;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now - i * 5 * 60 * 1000);
    base.push({ idx: idx++, time: timeLabel(d), ph: 7.2 });
  }
  base.push({ idx: idx++, time: timeLabel(), ph: 6.9 });
  return base;
}

export default function Dashboard() {
  const [data, setData] = useState({ ph: 6.9, cl: 0.2, t: 28 });
  const [history, setHistory] = useState([]);

  // cargar historial de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setHistory(parsed);
          const last = parsed[parsed.length - 1];
          setData(d => ({ ...d, ph: +(last.ph).toFixed(1) }));
          return;
        }
      }
    } catch {}
    setHistory(seedHistory());
  }, []);

  // guardar historial cuando cambia
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(history)); } catch {}
  }, [history]);

  const s = {
    ph: evalState(data.ph, TH.ph),
    cl: evalState(data.cl, TH.cl),
    t:  evalState(data.t,  TH.t),
  };

  const alerts = [
    ...(s.ph==="warn"||s.ph==="danger" ? [{
      type: s.ph==="danger"?"danger":"warn",
      title: s.ph==="danger"?"pH crítico":"pH bajo",
      msg: `pH: ${data.ph}. ${s.ph==="danger"?"Agregue regulador alcalino de inmediato.":"Se recomienda agregar regulador alcalino."}`,
      time: timeLabel()
    }] : []),
    ...(s.cl==="danger" ? [{
      type: "danger",
      title: "Nivel de cloro crítico",
      msg: `Cloro libre: ${data.cl} ppm. Agregue cloro inmediatamente.`,
      time: timeLabel()
    }] : [])
  ];

  function simulate() {
    const next = randomData();
    setData(next);
    setHistory(h => {
      const nextIdx = (h[h.length - 1]?.idx ?? -1) + 1;
      const arr = [...h, { idx: nextIdx, time: timeLabel(), ph: next.ph }];
      if (arr.length > 30) arr.shift();
      return arr;
    });
  }

  function clearHistory() {
    setHistory(seedHistory());
  }

  return (
    <div className="space-y-5">
      {/* Controles */}
      <div className="flex justify-end gap-2">
        <button
          onClick={clearHistory}
          className="flex items-center gap-2 border px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
        >
          <Trash2 className="w-4 h-4" /> Borrar historial
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
        <StatCard title="Nivel de pH" value={data.ph} unit=""  range="Rango normal: 7.2 – 7.8"    state={s.ph} icon={FlaskConical} />
        <StatCard title="Cloro Libre" value={data.cl} unit="ppm" range="Rango normal: 0.5 – 1.5 ppm" state={s.cl} icon={Droplets} />
        <StatCard title="Temperatura" value={data.t} unit="°C"   range="Rango normal: 20 – 35 °C"   state={s.t} icon={Thermometer} />
      </div>

      {/* Gráfico con idx en eje X */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Evolución de pH</h3>
          <span className="text-xs text-slate-500">Se actualiza al simular</span>
        </div>
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
              <Line
                type="monotone"
                dataKey="ph"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Paneles inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertsPanel alerts={alerts} />
        <ActionConfirm />
      </div>
    </div>
  );
}
