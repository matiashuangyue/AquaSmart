import Sidebar from "../components/Sidebar";
import HeaderBar from "../components/HeaderBar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <HeaderBar />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
