import { useEffect, useState } from "react";
import { usecases } from "../../composition/container";

const number = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export default function ThresholdsPage({ onSaved }) {
  const [form, setForm] = useState({
    phMin: 7.2, phMax: 7.8,
    chlorMin: 0.5, chlorMax: 1.5,
    tempMin: 20, tempMax: 35
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

 useEffect(() => {
  (async () => {
    try {
      const th = await usecases.loadThresholds("pool1"); // ← devuelve dominio { ph:{min,max}, cl:{...}, t:{...} }
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
      setMsg("No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  })();
}, []);


 async function save() {
  setSaving(true); setMsg("");
  try {
    const payload = {
      poolId: "pool1",
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
    await usecases.saveThresholds(payload); // ← el mapper del httpRepo lo transforma a API
    setMsg("✅ Umbrales guardados.");
    onSaved?.();
  } catch (e) {
    console.error(e);
    setMsg("Error al guardar umbrales.");
  } finally {
    setSaving(false);
  }
}


  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Configuración de umbrales</h1>

      <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
        <Section title="pH">
          <TwoCols>
            <Field label="Mínimo">
              <input className="w-full border rounded p-2" value={form.phMin}
                     onChange={e=>setForm(f=>({...f, phMin:e.target.value}))}/>
            </Field>
            <Field label="Máximo">
              <input className="w-full border rounded p-2" value={form.phMax}
                     onChange={e=>setForm(f=>({...f, phMax:e.target.value}))}/>
            </Field>
          </TwoCols>
        </Section>

        <Section title="Cloro libre (ppm)">
          <TwoCols>
            <Field label="Mínimo">
              <input className="w-full border rounded p-2" value={form.chlorMin}
                     onChange={e=>setForm(f=>({...f, chlorMin:e.target.value}))}/>
            </Field>
            <Field label="Máximo">
              <input className="w-full border rounded p-2" value={form.chlorMax}
                     onChange={e=>setForm(f=>({...f, chlorMax:e.target.value}))}/>
            </Field>
          </TwoCols>
        </Section>

        <Section title="Temperatura (°C)">
          <TwoCols>
            <Field label="Mínimo">
              <input className="w-full border rounded p-2" value={form.tempMin}
                     onChange={e=>setForm(f=>({...f, tempMin:e.target.value}))}/>
            </Field>
            <Field label="Máximo">
              <input className="w-full border rounded p-2" value={form.tempMax}
                     onChange={e=>setForm(f=>({...f, tempMax:e.target.value}))}/>
            </Field>
          </TwoCols>
        </Section>

        <div className="flex items-center gap-2 pt-2">
          <button onClick={save}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl">
            {saving ? "Guardando..." : "Guardar"}
          </button>
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
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
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-slate-600">{label}</span>
      {children}
    </label>
  );
}
