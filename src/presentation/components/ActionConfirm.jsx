import { useState } from "react";

export default function ActionConfirm({ onConfirm }) {
  const [text, setText] = useState("");

  function handleConfirm() {
    if (!text.trim()) return;
    onConfirm?.(text);
    setText("");
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4">
      <h3 className="font-semibold text-slate-800 mb-3">Acción correctiva</h3>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Ejemplo: Agregué 20 ml de regulador de pH"
        className="w-full border rounded-lg p-2 text-sm text-slate-700"
      />
      <button
        onClick={handleConfirm}
        className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm font-medium"
      >
        Confirmar acción
      </button>
    </div>
  );
}
