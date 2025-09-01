export default function ActionConfirm() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4">
      <h3 className="font-semibold text-slate-800 mb-3">¿Realizaste alguna acción?</h3>
      <p className="text-sm text-slate-500 mb-3">
        Confirma la acción realizada para detener las notificaciones
      </p>

      <select className="w-full border rounded-xl px-3 py-2 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300">
        <option value="">Selecciona la acción realizada</option>
        <option>Agregar regulador alcalino</option>
        <option>Agregar cloro granulado</option>
        <option>Ajustar temperatura</option>
      </select>

      <button className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl py-2 font-medium">
        Confirmar acción
      </button>
    </div>
  );
}
