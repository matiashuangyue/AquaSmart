export default function StatusPill({ state = "ok", children }) {
  const map = { ok: "bg-ok text-white", warn: "bg-warn text-white", danger: "bg-danger text-white" };
  return <span className={`badge ${map[state]}`}>{children}</span>;
}
