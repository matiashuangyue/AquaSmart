import { useEffect, useState } from "react";
import { usecases } from "../../composition/container";

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      try {
        const h = await usecases.getHistory("pool1");
        setRows(h);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Historial</h1>
      <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Hora</Th><Th>pH</Th><Th>Cloro (ppm)</Th><Th>Temp (°C)</Th><Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t">
                <Td>{r.time}</Td>
                <Td>{r.ph}</Td>
                <Td>{r.cl}</Td>
                <Td>{r.t}</Td>
                <Td>{statusOf(r)}</Td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td colSpan={5} className="py-6 text-center text-slate-500">Sin lecturas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusOf(r) {
  // Simple: OK si ph en [7.2,7.8] y cl en [0.5,1.5] y t en [20,35]
  const ok = (v,min,max)=> v>=min && v<=max;
  const okAll = ok(r.ph,7.2,7.8) && ok(r.cl,0.5,1.5) && ok(r.t,20,35);
  return okAll ? "OK" : "Fuera de rango";
}

function Th({children}) { return <th className="px-3 py-2 text-left font-medium">{children}</th>; }
function Td({children}) { return <td className="px-3 py-2">{children}</td>; }
