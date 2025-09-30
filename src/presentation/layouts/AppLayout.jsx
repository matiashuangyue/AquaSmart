import Sidebar from "../components/Sidebar";
import HeaderBar from "../components/HeaderBar";

export default function AppLayout({ children, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 hidden md:block border-r bg-white">
        <Sidebar />
      </aside>

      {/* Contenido */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow">
          <HeaderBar onLogout={onLogout} />
        </header>

        {/* Página */}
        <section className="p-4 md:p-6">
          {children}
        </section>
      </main>
    </div>
  );
}
