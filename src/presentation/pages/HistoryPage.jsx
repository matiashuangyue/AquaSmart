import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { usecases } from "../../composition/container";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { listMyPools } from "../../infra/http/pools";

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // piletas
  const [pools, setPools] = useState([]);
  const [activePoolId, setActivePoolId] = useState(null);
  const [loadingPools, setLoadingPools] = useState(false);
  const [errPools, setErrPools] = useState("");

  // filtros editables
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [alertType, setAlertType] = useState("ALL"); // ALL | OK | WARN | CRIT

  // filtros aplicados
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [appliedAlertType, setAppliedAlertType] = useState("ALL");

  // ref para exportar el gráfico
  const chartRef = useRef(null);

  // cargar piletas del usuario
  useEffect(() => {
    (async () => {
      try {
        setLoadingPools(true);
        setErrPools("");
        const list = await listMyPools();
        setPools(list);
        if (!activePoolId && list.length > 0) {
          setActivePoolId(list[0].id);
        }
      } catch (e) {
        console.error(e);
        setErrPools(e.message || "No se pudieron cargar las piletas.");
      } finally {
        setLoadingPools(false);
      }
    })();
  }, []);

  // cargar historial cuando cambie la pileta
  useEffect(() => {
    if (!activePoolId) {
      setRows([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const h = await usecases.getHistory(activePoolId);
        setRows(h || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [activePoolId]);

  const applyFilters = () => {
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedAlertType(alertType);
  };

  // ordenar de "ahora hacia atrás" + aplicar filtros
  const filteredRows = useMemo(() => {
    const from = appliedDateFrom ? new Date(appliedDateFrom) : null;
    const to = appliedDateTo ? new Date(appliedDateTo) : null;

    const ordered = [...rows].sort(
      (a, b) => parseTime(b.time) - parseTime(a.time)
    );

    return ordered.filter((r) => {
      const d = parseDateOnly(r.time); // solo fecha (sin hora)

      if (d && from && d < from) return false;
      if (d && to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        if (d > toEnd) return false;
      }

      const st = statusOf(r);
      if (appliedAlertType !== "ALL" && st.code !== appliedAlertType) {
        return false;
      }

      return true;
    });
  }, [rows, appliedDateFrom, appliedDateTo, appliedAlertType]);

  // datos para el chart
  const chartData = useMemo(() => {
    const asc = [...filteredRows].sort(
      (a, b) => parseTime(a.time) - parseTime(b.time)
    );
    return asc.map((r) => ({
      time: formatTimeShort(r.time),
      ph: r.ph,
      cl: r.cl,
      t: r.t,
    }));
  }, [filteredRows]);

  // exportar gráfico como PNG
  const exportChartPng = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "historial_aquasmart_chart.png";
    link.click();
  };

  const currentPool = pools.find((p) => p.id === activePoolId) || null;
  const currentPoolName = currentPool?.name || "";

  if (loading && !rows.length) return <div className="p-4">Cargando…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Historial</h1>

      {/* INFO PILETA SELECCIONADA */}
      <div className="bg-white border rounded-2xl shadow-sm p-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between text-xs">
        <div>
          <span className="text-slate-500">Pileta seleccionada: </span>
          {currentPool ? (
            <span className="font-medium text-slate-800">
              {currentPool.name}{" "}
              {currentPool.estadoPileta ? `(${currentPool.estadoPileta})` : ""}
            </span>
          ) : loadingPools ? (
            <span className="text-slate-500">Cargando piletas…</span>
          ) : (
            <span className="text-slate-500">
              No hay piletas. Creá una desde el menú “Piletas”.
            </span>
          )}
          {errPools && (
            <div className="text-rose-600 mt-1">{errPools}</div>
          )}
        </div>
        {pools.length > 0 && (
          <div className="flex items-center gap-2 mt-1 md:mt-0">
            <span className="text-slate-500">Cambiar pileta:</span>
            <select
              className="border rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={activePoolId || ""}
              onChange={(e) => setActivePoolId(e.target.value || null)}
            >
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* FILTROS + APLICAR + EXPORTAR */}
      <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Desde fecha
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Hasta fecha
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Tipo de alerta
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="ALL">Todas</option>
              <option value="OK">OK</option>
              <option value="WARN">Advertencia</option>
              <option value="CRIT">Crítica</option>
            </select>
          </div>
          <button
            onClick={applyFilters}
            className="mt-4 md:mt-5 inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-xs font-medium px-3 py-2 hover:bg-emerald-700"
          >
            Aplicar filtros
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportCsv(filteredRows, currentPoolName)}
            className="self-start md:self-auto inline-flex items-center gap-1 rounded-full bg-slate-800 text-white text-xs font-medium px-3 py-2 hover:bg-slate-900"
            disabled={!filteredRows.length}
          >
            Exportar informe (CSV)
          </button>

          <button
            onClick={exportChartPng}
            className="self-start md:self-auto inline-flex items-center gap-1 rounded-full bg-sky-600 text-white text-xs font-medium px-3 py-2 hover:bg-sky-700"
          >
            Exportar gráfico (PNG)
          </button>
        </div>
      </div>

      {/* CHART */}
      <div
        className="bg-white border rounded-2xl shadow-sm p-4 h-72"
        style={{ minWidth: 0 }}
      >
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Evolución de parámetros
        </h2>
        {chartData.length === 0 ? (
          <p className="text-xs text-slate-500">No hay datos para graficar.</p>
        ) : (
          <div ref={chartRef} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ph"
                  name="pH"
                  stroke="#0f766e"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cl"
                  name="Cloro (ppm)"
                  stroke="#ea580c"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="t"
                  name="Temp (°C)"
                  stroke="#1d4ed8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TABLA */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Pileta</Th>
              <Th>Fecha</Th>
              <Th>Hora</Th>
              <Th>pH</Th>
              <Th>Cloro (ppm)</Th>
              <Th>Temp (°C)</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, i) => {
              const st = statusOf(r);
              return (
                <tr key={i} className="border-t">
                  <Td>{currentPoolName || "-"}</Td>
                  <Td>{formatDate(r.time)}</Td>
                  <Td>{formatTimeOnly(r.time)}</Td>
                  <Td>{r.ph}</Td>
                  <Td>{r.cl}</Td>
                  <Td>{r.t}</Td>
                  <Td>
                    <span
                      className={
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs " +
                        statusClass(st.code)
                      }
                    >
                      {st.label}
                    </span>
                  </Td>
                </tr>
              );
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-slate-500 text-sm"
                >
                  Sin lecturas para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** --- Helpers de fecha/hora --- */

function parseTime(time) {
  const d = tryParseDateTime(time);
  return d ? d.getTime() : 0;
}

function parseDateOnly(time) {
  const d = tryParseDateTime(time);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function tryParseDateTime(time) {
  if (!time) return null;
  const clean = String(time).trim().replace(/(^"|"$)/g, "");

  const iso = Date.parse(clean);
  if (!Number.isNaN(iso)) {
    return new Date(iso);
  }

  const match =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(
      clean
    );

  if (match) {
    const [, dd, mm, yyyy, hh = "0", min = "0", ss = "0"] = match;
    return new Date(
      parseInt(yyyy),
      parseInt(mm) - 1,
      parseInt(dd),
      parseInt(hh),
      parseInt(min),
      parseInt(ss)
    );
  }

  return null;
}

function formatDate(time) {
  const d = tryParseDateTime(time);
  if (!d) return "-";
  return d.toLocaleDateString();
}

function formatTimeOnly(time) {
  const d = tryParseDateTime(time);
  if (!d) return "-";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTimeShort(time) {
  const d = tryParseDateTime(time);
  if (!d) return String(time);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** --- Estado / alertas --- */

function statusOf(r) {
  const ok = (v, min, max) => v >= min && v <= max;

  const okPh = ok(r.ph, 7.2, 7.8);
  const okCl = ok(r.cl, 0.5, 1.5);
  const okT = ok(r.t, 20, 35);

  const allOk = okPh && okCl && okT;
  if (allOk) return { code: "OK", label: "OK" };

  const veryOff = (v, min, max) => {
    const margin = (max - min) * 0.2;
    return v < min - margin || v > max + margin;
  };

  if (
    veryOff(r.ph, 7.2, 7.8) ||
    veryOff(r.cl, 0.5, 1.5) ||
    veryOff(r.t, 20, 35)
  ) {
    return { code: "CRIT", label: "Crítica" };
  }

  return { code: "WARN", label: "Advertencia" };
}

function statusClass(code) {
  switch (code) {
    case "OK":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "WARN":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "CRIT":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    default:
      return "";
  }
}

/** --- Mini componentes tabla --- */

function Th({ children }) {
  return (
    <th className="px-3 py-2 text-left font-medium text-xs md:text-sm">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="px-3 py-2 text-xs md:text-sm align-middle">{children}</td>
  );
}

/** --- Export CSV --- */

function exportCsv(rows, poolName = "") {
  if (!rows || rows.length === 0) return;

  const header = ["Pileta", "Fecha", "Hora", "pH", "Cloro_ppm", "Temp_C", "Estado"];
  const lines = [header.join(";")];

  rows.forEach((r) => {
    const st = statusOf(r);

    const d = tryParseDateTime(r.time);
    let fecha = "";
    let hora = "";

    if (d) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      fecha = `${dd}/${mm}/${yyyy}`;

      const h = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      hora = `${h}:${min}`;
    }

    let estado = st.label;
    if (estado === "Crítica") estado = "Critica";

    lines.push([poolName, fecha, hora, r.ph, r.cl, r.t, estado].join(";"));
  });

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "historial_aquasmart.csv";
  a.click();

  URL.revokeObjectURL(url);
}
