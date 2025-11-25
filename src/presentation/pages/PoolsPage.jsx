import { useEffect, useState } from "react";
import {
  createPool,
  listMyPools,
  updatePool,
} from "../../infra/http/pools";

export default function PoolsPage({ onCreated }) {
  const [name, setName] = useState("");
  const [pools, setPools] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editVolumen, setEditVolumen] = useState("");
  const [editLargo, setEditLargo] = useState("");
  const [editAncho, setEditAncho] = useState("");
  const [editProf, setEditProf] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState("");

  async function loadPools() {
    try {
      setLoadingList(true);
      setErr("");
      const data = await listMyPools();
      setPools(data);
    } catch (e) {
      setErr(e.message || "Error cargando piletas.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadPools();
  }, []);

  async function onSubmitCreate(e) {
    e.preventDefault();
    setErr("");

    if (!name.trim()) {
      setErr("Ingresá un nombre para la pileta.");
      return;
    }

    try {
      setLoading(true);
      const created = await createPool({ name: name.trim() });
      setName("");
      setPools((prev) => [...prev, created]);
      onCreated?.(created);
    } catch (e) {
      setErr(e.message || "No se pudo crear la pileta.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(pool) {
    setEditingId(pool.id);
    setEditName(pool.name || "");
    setEditVolumen(pool.volumen != null ? String(pool.volumen) : "");
    setEditLargo(pool.largo != null ? String(pool.largo) : "");
    setEditAncho(pool.ancho != null ? String(pool.ancho) : "");
    setEditProf(
      pool.profundidadPromedio != null
        ? String(pool.profundidadPromedio)
        : ""
    );
    setEditEstado(pool.estadoPileta || "OK");
    setEditErr("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditVolumen("");
    setEditLargo("");
    setEditAncho("");
    setEditProf("");
    setEditEstado("");
    setEditErr("");
  }

  async function onSubmitEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    try {
      setSavingEdit(true);
      setEditErr("");

      const payload = {
        name: editName,
        volumen: editVolumen ? parseFloat(editVolumen) : null,
        largo: editLargo ? parseFloat(editLargo) : null,
        ancho: editAncho ? parseFloat(editAncho) : null,
        profundidadPromedio: editProf ? parseFloat(editProf) : null,
        estadoPileta: editEstado,
      };

      const updated = await updatePool(editingId, payload);

      setPools((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      cancelEdit();
    } catch (e) {
      setEditErr(e.message || "No se pudo actualizar la pileta.");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Mis piletas
          </h1>
          <p className="text-xs text-slate-500">
            Creá y administrá las piletas asociadas a tu cuenta. Podés ajustar
            sus dimensiones físicas y estado.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.1fr_1.2fr] gap-4 items-start">
        {/* Formulario crear pileta */}
        <div className="bg-white rounded-2xl shadow border border-slate-100 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Agregar nueva pileta
          </h2>

          <form onSubmit={onSubmitCreate} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Nombre de la pileta
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-slate-200"
                placeholder="Ej: Pileta principal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            {err && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-70"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Creando..." : "Crear pileta"}
            </button>
          </form>
        </div>

        {/* Listado de piletas + editor */}
        <div className="bg-white rounded-2xl shadow border border-slate-100 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Piletas registradas
            </h2>
            {loadingList && (
              <span className="text-[11px] text-slate-400">
                Cargando...
              </span>
            )}
          </div>

          {pools.length === 0 && !loadingList && (
            <p className="text-xs text-slate-500">
              Todavía no tenés ninguna pileta registrada.
            </p>
          )}

          <ul className="space-y-2 max-h-60 overflow-auto pr-1">
            {pools.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium text-slate-800">{p.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Estado: {p.estadoPileta || "OK"}
                    {p.volumen != null && ` · Vol: ${p.volumen} m³`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="text-xs px-2 py-1 rounded-md border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  Editar
                </button>
              </li>
            ))}
          </ul>

          {editingId && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <h3 className="text-xs font-semibold text-slate-700 mb-2">
                Editar pileta
              </h3>
              <form onSubmit={onSubmitEdit} className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-slate-600">
                    Nombre
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 border-slate-200"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={savingEdit}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Volumen (m³)
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 border-slate-200"
                    value={editVolumen}
                    onChange={(e) => setEditVolumen(e.target.value)}
                    disabled={savingEdit}
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Largo (m)
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 border-slate-200"
                    value={editLargo}
                    onChange={(e) => setEditLargo(e.target.value)}
                    disabled={savingEdit}
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Ancho (m)
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 border-slate-200"
                    value={editAncho}
                    onChange={(e) => setEditAncho(e.target.value)}
                    disabled={savingEdit}
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Profundidad prom. (m)
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 border-slate-200"
                    value={editProf}
                    onChange={(e) => setEditProf(e.target.value)}
                    disabled={savingEdit}
                    inputMode="decimal"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 text-slate-600">
                    Estado de la pileta
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 border-slate-200"
                    value={editEstado}
                    onChange={(e) => setEditEstado(e.target.value)}
                    disabled={savingEdit}
                    placeholder="Ej: OK, En mantenimiento, Cerrada"
                  />
                </div>

                {editErr && (
                  <div className="sm:col-span-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                    {editErr}
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
                    disabled={savingEdit}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-70 inline-flex items-center gap-2"
                  >
                    {savingEdit && (
                      <span className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    )}
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
