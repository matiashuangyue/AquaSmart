import { useEffect, useState } from "react";
import { usecases } from "../../composition/container";
import { listMyPools } from "../../infra/http/pools";

const number = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export default function ThresholdsPage({ onSaved }) {
  const [form, setForm] = useState({
    phMin: 7.2,
    phMax: 7.8,
    chlorMin: 0.5,
    chlorMax: 1.5,
    tempMin: 20,
    tempMax: 35,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // --- NUEVO: configuración de notificaciones ---
  // NONE = desactivado
  // EACH = un mail por cada advertencia/crítica
  // EVERY_5_MIN = como máximo cada 5 minutos
  // DAILY = como máximo una vez por día
  const [notifMode, setNotifMode] = useState("NONE");

  // cargar preferencia de notificación desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("as_notifMode");
      if (stored) setNotifMode(stored);
    } catch {
      // ignorar errores de localStorage
    }
  }, []);

  function handleNotifChange(e) {
    const value = e.target.value;
    setNotifMode(value);
    try {
      localStorage.setItem("as_notifMode", value);
    } catch {
      // ignorar errores
    }
  }

  // --- manejo de piletas ---
  const [pools, setPools] = useState([]);
  const [activePoolId, setActivePoolId] = useState(null);
  const [errPools, setErrPools] = useState("");

  // Cargar piletas + umbrales de la pileta seleccionada
  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      setErrPools("");
      try {
        // 1) Traer piletas del usuario
        const list = await listMyPools();
        setPools(list);

        let poolId = activePoolId;
        if (!poolId && list.length > 0) {
          poolId = list[0].id; // default a la primera pileta
        }
        setActivePoolId(poolId || null);

        // 2) Si hay pileta seleccionada, traer sus umbrales
        if (poolId) {
          const th = await usecases.loadThresholds(poolId); // dominio { ph:{min,max}, cl:{...}, t:{...} }

          setForm({
            phMin: th?.ph?.min ?? 7.2,
            phMax: th?.ph?.max ?? 7.8,
            chlorMin: th?.cl?.min ?? 0.5,
            chlorMax: th?.cl?.max ?? 1.5,
            tempMin: th?.t?.min ?? 20,
            tempMax: th?.t?.max ?? 35,
          });
        } else {
          setMsg("No hay piletas. Creá una desde el menú Piletas.");
        }
      } catch (e) {
        console.error(e);
        setErrPools("No se pudieron cargar las piletas o umbrales.");
        setMsg("No se pudo cargar la configuración.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo al montar la página

  // Cuando el usuario cambia de pileta desde el select
  async function handleChangePool(poolId) {
    setActivePoolId(poolId || null);
    setMsg("");
    if (!poolId) return;

    setLoading(true);
    try {
      const th = await usecases.loadThresholds(poolId);
      setForm({
        phMin: th?.ph?.min ?? 7.2,
        phMax: th?.ph?.max ?? 7.8,
        chlorMin: th?.cl?.min ?? 0.5,
        chlorMax: th?.cl?.max ?? 1.5,
        tempMin: th?.t?.min ?? 20,
        tempMax: th?.t?.max ?? 35,
      });
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar la configuración de umbrales para esta pileta.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMsg("");

    if (!activePoolId) {
      setMsg("Seleccioná una pileta para guardar sus umbrales.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        poolId: activePoolId, // 👈 se guarda para la pileta seleccionada
        ph: {
          min: number(form.phMin, 7.2),
          max: number(form.phMax, 7.8),
        },
        cl: {
          min: number(form.chlorMin, 0.5),
          max: number(form.chlorMax, 1.5),
        },
        t: {
          min: number(form.tempMin, 20),
          max: number(form.tempMax, 35),
        },
      };

      await usecases.saveThresholds(payload); // el httpRepo ya lo lleva a la API
      setMsg("✅ Umbrales guardados para la pileta seleccionada.");
      onSaved?.(); // esto hace que el Dashboard recargue con thVersion
    } catch (e) {
      console.error(e);
      setMsg("Error al guardar umbrales.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !pools.length && !activePoolId) {
    return <div className="p-4">Cargando…</div>;
  }

  const currentPool = pools.find((p) => p.id === activePoolId) || null;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">
        Configuración de umbrales
      </h1>

      {/* Selector de pileta (igual estilo que Dashboard) */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">
              Pileta seleccionada
            </span>
            {currentPool ? (
              <span className="text-sm font-medium text-slate-800">
                {currentPool.name}{" "}
                {currentPool.estadoPileta
                  ? `(${currentPool.estadoPileta})`
                  : ""}
              </span>
            ) : (
              <span className="text-sm text-slate-500">
                {!pools.length
                  ? "No hay piletas. Creá una desde el menú Piletas."
                  : "Seleccioná una pileta."}
              </span>
            )}
            {errPools && (
              <span className="text-[11px] text-rose-600">
                {errPools}
              </span>
            )}
          </div>

          {pools.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">
                Cambiar pileta:
              </label>
              <select
                className="border rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={activePoolId || ""}
                onChange={(e) => handleChangePool(e.target.value)}
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

        <p className="text-[11px] text-slate-500 mt-1">
          Los umbrales se guardan por pileta. Cambiá la pileta para
          configurar distintos valores según cada contexto (climatizadas,
          exteriores, etc.).
        </p>
      </div>

      {/* Formulario de umbrales */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
        <Section title="pH">
          <TwoCols>
            <Field label="Mínimo">
              <input
                className="w-full border rounded p-2"
                value={form.phMin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phMin: e.target.value }))
                }
              />
            </Field>
            <Field label="Máximo">
              <input
                className="w-full border rounded p-2"
                value={form.phMax}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phMax: e.target.value }))
                }
              />
            </Field>
          </TwoCols>
        </Section>

        <Section title="Cloro libre (ppm)">
          <TwoCols>
            <Field label="Mínimo">
              <input
                className="w-full border rounded p-2"
                value={form.chlorMin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    chlorMin: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Máximo">
              <input
                className="w-full border rounded p-2"
                value={form.chlorMax}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    chlorMax: e.target.value,
                  }))
                }
              />
            </Field>
          </TwoCols>
        </Section>

        <Section title="Temperatura (°C)">
          <TwoCols>
            <Field label="Mínimo">
              <input
                className="w-full border rounded p-2"
                value={form.tempMin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tempMin: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Máximo">
              <input
                className="w-full border rounded p-2"
                value={form.tempMax}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tempMax: e.target.value,
                  }))
                }
              />
            </Field>
          </TwoCols>
        </Section>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={save}
            disabled={saving || !activePoolId}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl"
          >
            {saving
              ? "Guardando..."
              : "Guardar umbrales de esta pileta"}
          </button>
          {msg && (
            <span className="text-sm text-slate-600">{msg}</span>
          )}
        </div>
      </div>

      {/* NUEVO: Configuración de alertas por email */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-slate-800">
          Notificaciones por email
        </h2>
        <p className="text-xs text-slate-500">
          Elegí cuándo querés que AquaSmart te envíe un email si las lecturas
          quedan en advertencia o crítico. Esta preferencia se guarda en el
          navegador y se enviará al backend al simular lecturas.
        </p>

        <div className="mt-2 flex flex-col gap-1 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-indigo-600"
              value="NONE"
              checked={notifMode === "NONE"}
              onChange={handleNotifChange}
            />
            <span>Desactivar notificaciones</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-indigo-600"
              value="EACH"
              checked={notifMode === "EACH"}
              onChange={handleNotifChange}
            />
            <span>Recibir un email por cada advertencia/crítica</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-indigo-600"
              value="EVERY_5_MIN"
              checked={notifMode === "EVERY_5_MIN"}
              onChange={handleNotifChange}
            />
            <span>Como máximo cada 5 minutos</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-indigo-600"
              value="DAILY"
              checked={notifMode === "DAILY"}
              onChange={handleNotifChange}
            />
            <span>Como máximo una vez por día</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <div className="font-semibold text-slate-700">{title}</div>
      {children}
    </div>
  );
}
function TwoCols({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-slate-600">{label}</span>
      {children}
    </label>
  );
}
