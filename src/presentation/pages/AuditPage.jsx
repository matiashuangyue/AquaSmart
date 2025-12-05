import { useEffect, useState, useMemo } from "react";
import html2canvas from "html2canvas";
import { getToken } from "../../lib/session";

// Helper: traducir código de acción a algo más legible
function labelForAction(code) {
  switch (code) {
    case "LOGIN":
      return "Login";
    case "LOGOUT":
      return "Logout";
    case "SIGNUP":
      return "Registro";
    case "CREAR_PILETA":
      return "Crear pileta";
    case "EDITAR_PILETA":
      return "Editar pileta";
    case "EDITAR_UMBRAL":
      return "Editar umbrales";
    case "SIMULAR_LECTURA":
      return "Simular lectura";
    case "CREAR_USUARIO":
      return "Crear usuario";
    case "EDITAR_USUARIO":
      return "Editar usuario";
    default:
      // fallback: mostrar el código tal cual
      return code || "(sin acción)";
  }
}

// Helper opcional: etiqueta para módulo (por ahora solo capitalizamos)
function labelForModule(mod) {
  if (!mod) return "(sin módulo)";
  return mod;
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [type, setType] = useState("ALL");    // acción
  const [module, setModule] = useState("ALL"); // módulo

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const API = import.meta.env.VITE_API_URL;
        const token = getToken();

        const r = await fetch(`${API}/api/audit`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!r.ok) {
          console.error("Error al cargar auditoría:", await r.text());
          setLogs([]);
          return;
        }

        const data = await r.json();
        setLogs(data || []);
      } catch (e) {
        console.error(e);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Opciones dinámicas de acción según lo que realmente hay en la auditoría
  const actionOptions = useMemo(() => {
    const set = new Set();
    logs.forEach((l) => {
      if (l.accion) set.add(l.accion);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [logs]);

  // Opciones dinámicas de módulo
  const moduleOptions = useMemo(() => {
    const set = new Set();
    logs.forEach((l) => {
      if (l.modulo) set.add(l.modulo);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [logs]);

  const filtered = useMemo(() => {
    let arr = [...logs];

    // Filtro por fecha desde
    if (dateFrom) {
      arr = arr.filter((l) => new Date(l.fechaHora) >= new Date(dateFrom));
    }

    // Filtro por fecha hasta (incluimos todo ese día)
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      arr = arr.filter((l) => new Date(l.fechaHora) <= to);
    }

    // Filtro por acción
    if (type !== "ALL") {
      arr = arr.filter((l) => l.accion === type);
    }

    // Filtro por módulo
    if (module !== "ALL") {
      arr = arr.filter((l) => l.modulo === module);
    }

    // Orden descendente por fecha
    return arr.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
  }, [logs, dateFrom, dateTo, type, module]);

  function exportCsv() {
  const header = "Fecha;Hora;Usuario;Acción;Módulo;Detalle\n";
  const lines = filtered
    .map((l) => {
      const d = new Date(l.fechaHora);
      const fecha = d.toLocaleDateString();
      const hora = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const accionLabel = labelForAction(l.accion);
      const moduloLabel = labelForModule(l.modulo);

      return `${fecha};${hora};${l.usuario};${accionLabel};${moduloLabel};${l.detalle}`;
    })
    .join("\n");

  // 👇 BOM UTF-8 para que Excel no rompa ñ, tildes, etc.
  const csvContent = "\uFEFF" + header + lines;

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "auditoria_logs.csv";
  a.click();
  URL.revokeObjectURL(url);
}


  if (loading) return <div className="p-4">Cargando auditoría…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Auditorías</h1>

      {/* FILTROS */}
      <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs">Desde</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs">Hasta</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs">Tipo acción</label>
          <select
            className="border rounded px-2 py-1"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {actionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "ALL" ? "Todas" : labelForAction(opt)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs">Módulo</label>
          <select
            className="border rounded px-2 py-1"
            value={module}
            onChange={(e) => setModule(e.target.value)}
          >
            {moduleOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "ALL" ? "Todos" : labelForModule(opt)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={exportCsv}
          className="bg-slate-800 text-white px-3 py-2 rounded-full text-xs"
        >
          Exportar CSV
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Hora</th>
              <th className="px-3 py-2 text-left">Usuario</th>
              <th className="px-3 py-2 text-left">Acción</th>
              <th className="px-3 py-2 text-left">Módulo</th>
              <th className="px-3 py-2 text-left">Detalle</th>
              <th className="px-3 py-2 text-left">Pileta</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((l) => {
              const d = new Date(l.fechaHora);
              const fecha = d.toLocaleDateString();
              const hora = d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <tr key={l.id} className="border-t">
                  <td className="px-3 py-2">{fecha}</td>
                  <td className="px-3 py-2">{hora}</td>
                  <td className="px-3 py-2">{l.usuario}</td>
                  <td className="px-3 py-2">{labelForAction(l.accion)}</td>
                  <td className="px-3 py-2">{labelForModule(l.modulo)}</td>
                  <td className="px-3 py-2">{l.detalle}</td>
                  <td className="px-3 py-2">{l.piletaNombre}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
