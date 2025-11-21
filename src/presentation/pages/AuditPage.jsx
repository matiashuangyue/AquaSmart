import { useEffect, useState, useMemo } from "react";
import html2canvas from "html2canvas";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [type, setType] = useState("ALL");

  useEffect(() => {
    // TEMPORAL: simulado (después lo conectamos al API)
    const fakeLogs = [
      {
        id: 1,
        usuario: "yue.huang",
        accion: "LOGIN",
        modulo: "Auth",
        detalle: "Inicio de sesión",
        fechaHora: "2025-11-18T08:55:00.000Z",
      },
      {
        id: 2,
        usuario: "juan.perez",
        accion: "CREAR_PILETA",
        modulo: "Piletas",
        detalle: "Creó Pileta ID:12",
        fechaHora: "2025-11-18T09:00:00.000Z",
      },
    ];

    setLogs(fakeLogs);
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    let arr = [...logs];

    if (dateFrom) {
      arr = arr.filter((l) => new Date(l.fechaHora) >= new Date(dateFrom));
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      arr = arr.filter((l) => new Date(l.fechaHora) <= to);
    }
    if (type !== "ALL") {
      arr = arr.filter((l) => l.accion === type);
    }

    return arr.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
  }, [logs, dateFrom, dateTo, type]);

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
        return `${fecha};${hora};${l.usuario};${l.accion};${l.modulo};${l.detalle}`;
      })
      .join("\n");

    const blob = new Blob([header + lines], {
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
            <option value="ALL">Todas</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREAR_PILETA">Crear Pileta</option>
            <option value="EDITAR_UMBRAL">Editar Umbral</option>
            <option value="USUARIO">Usuarios</option>
            <option value="SENSORES">Sensores</option>
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
                  <td className="px-3 py-2">{l.accion}</td>
                  <td className="px-3 py-2">{l.modulo}</td>
                  <td className="px-3 py-2">{l.detalle}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
