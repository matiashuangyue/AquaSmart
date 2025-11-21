import { useMemo, useState } from "react";

// ===== Permisos base simulados (pensados como tu clase Permiso) =====
const INITIAL_PERMISSIONS = [
  {
    id: "VIEW_DASHBOARD",
    nombre: "Ver Dashboard",
    descripcion: "Acceso a la vista principal con métricas.",
  },
  {
    id: "VIEW_HISTORY",
    nombre: "Ver historial de lecturas",
    descripcion: "Puede ver el historial de sensores de la pileta.",
  },
  {
    id: "VIEW_AUDIT",
    nombre: "Ver auditorías",
    descripcion: "Acceso a la sección de logs del sistema.",
  },
  {
    id: "MANAGE_THRESHOLDS",
    nombre: "Configurar umbrales",
    descripcion: "Puede editar los umbrales de pH, cloro y temperatura.",
  },
  {
    id: "MANAGE_USERS",
    nombre: "Gestionar usuarios",
    descripcion: "Acceso a la sección de Gestión de Usuarios.",
  },
];

// ===== Grupos base simulados (relacionados por permisoIds) =====
const INITIAL_GROUPS = [
  {
    id: "ADMIN",
    nombre: "Admin",
    descripcion: "Acceso total a la plataforma.",
    permisoIds: [
      "VIEW_DASHBOARD",
      "VIEW_HISTORY",
      "VIEW_AUDIT",
      "MANAGE_THRESHOLDS",
      "MANAGE_USERS",
    ],
  },
  {
    id: "TECNICO",
    nombre: "Técnico",
    descripcion: "Operaciones sobre piletas y umbrales.",
    permisoIds: ["VIEW_DASHBOARD", "VIEW_HISTORY", "MANAGE_THRESHOLDS"],
  },
  {
    id: "OWNER",
    nombre: "Propietario",
    descripcion: "Dueño de la pileta, acceso a su información.",
    permisoIds: ["VIEW_DASHBOARD", "VIEW_HISTORY"],
  },
];

// ===== Usuarios base simulados =====
const INITIAL_USERS = [
  {
    id: 1,
    email: "admin@aquasmart.com",
    role: "ADMIN",
    createdAt: "2025-11-01T10:00:00.000Z",
    active: true,
  },
  {
    id: 2,
    email: "tecnico@aquasmart.com",
    role: "TECNICO",
    createdAt: "2025-11-10T08:30:00.000Z",
    active: true,
  },
  {
    id: 3,
    email: "propietario@cliente.com",
    role: "OWNER",
    createdAt: "2025-11-15T09:15:00.000Z",
    active: true,
  },
  {
    id: 4,
    email: "inactivo@cliente.com",
    role: "OWNER",
    createdAt: "2025-11-16T11:00:00.000Z",
    active: false,
  },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("users"); // "users" | "groups"
  const [users, setUsers] = useState(INITIAL_USERS);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("OWNER");
  const [formActive, setFormActive] = useState(true);

  // --- Derivados usuarios ---
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (search && !u.email.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
        if (statusFilter === "ACTIVE" && !u.active) return false;
        if (statusFilter === "INACTIVE" && u.active) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [users, search, roleFilter, statusFilter]);

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = totalCount - activeCount;

  // --- Handlers usuarios ---
  function openNewUserModal() {
    setEditingUser(null);
    setFormEmail("");
    setFormRole("OWNER");
    setFormActive(true);
    setModalOpen(true);
  }

  function openEditUserModal(user) {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormActive(user.active);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleSaveUser(e) {
    e.preventDefault();
    if (!formEmail.trim()) {
      alert("El email es obligatorio.");
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                email: formEmail.trim(),
                role: formRole,
                active: formActive,
              }
            : u
        )
      );
    } else {
      const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      const nowIso = new Date().toISOString();
      const newUser = {
        id: nextId,
        email: formEmail.trim(),
        role: formRole,
        createdAt: nowIso,
        active: formActive,
      };
      setUsers((prev) => [...prev, newUser]);
    }

    setModalOpen(false);
  }

  function handleDeleteUser(user) {
    if (!window.confirm(`¿Eliminar al usuario ${user.email}?`)) return;
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  // --- Render ---
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500">
            Control de accesos por rol y permisos vinculados a las
            funcionalidades reales (Dashboard, Historial, Auditorías, etc.).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openNewUserModal}
            className="inline-flex items-center px-3 py-2 rounded-full bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
          >
            + Nuevo usuario
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-sm">
        <button
          className={
            "pb-2 -mb-px border-b-2 " +
            (activeTab === "users"
              ? "border-indigo-600 text-indigo-700 font-medium"
              : "border-transparent text-slate-500 hover:text-slate-700")
          }
          onClick={() => setActiveTab("users")}
        >
          Usuarios
        </button>
        <button
          className={
            "pb-2 -mb-px border-b-2 " +
            (activeTab === "groups"
              ? "border-indigo-600 text-indigo-700 font-medium"
              : "border-transparent text-slate-500 hover:text-slate-700")
          }
          onClick={() => setActiveTab("groups")}
        >
          Grupos y permisos
        </button>
      </div>

      {activeTab === "users" ? (
        <UsersTab
          users={filteredUsers}
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onEdit={openEditUserModal}
          onDelete={handleDeleteUser}
          totalCount={totalCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
        />
      ) : (
        <GroupsTab
          groups={groups}
          setGroups={setGroups}
          permissions={permissions}
          setPermissions={setPermissions}
        />
      )}

      {modalOpen && (
        <UserModal
          onClose={closeModal}
          onSubmit={handleSaveUser}
          email={formEmail}
          setEmail={setFormEmail}
          role={formRole}
          setRole={setFormRole}
          active={formActive}
          setActive={setFormActive}
          editing={!!editingUser}
        />
      )}
    </div>
  );
}

// ===== Tab Usuarios =====

function UsersTab({
  users,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onEdit,
  onDelete,
  totalCount,
  activeCount,
  inactiveCount,
}) {
  return (
    <>
      {/* Filtros */}
      <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Buscar por email
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
              placeholder="admin@aquasmart.com"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Rol / Grupo
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="ADMIN">Admin</option>
              <option value="TECNICO">Técnico</option>
              <option value="OWNER">Propietario</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 space-y-0.5">
          <div>
            <span className="font-medium">{totalCount}</span> usuarios en total
          </div>
          <div>
            <span className="font-medium text-emerald-700">{activeCount}</span>{" "}
            activos ·{" "}
            <span className="font-medium text-slate-600">
              {inactiveCount}
            </span>{" "}
            inactivos
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>ID</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Fecha registro</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const d = new Date(u.createdAt);
              const fecha = d.toLocaleDateString();
              const rolLabel =
                u.role === "ADMIN"
                  ? "Admin"
                  : u.role === "TECNICO"
                  ? "Técnico"
                  : "Propietario";

              return (
                <tr key={u.id} className="border-t">
                  <Td>{u.id}</Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                      {rolLabel}
                    </span>
                  </Td>
                  <Td>{fecha}</Td>
                  <Td>
                    <span
                      className={
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs border " +
                        (u.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200")
                      }
                    >
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(u)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(u)}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 text-center text-slate-500 text-sm"
                >
                  No hay usuarios que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ===== Tab Grupos (permisos reales con checkbox) =====

function GroupsTab({ groups, setGroups, permissions, setPermissions }) {
  const [selectedGroupId, setSelectedGroupId] = useState(
    groups.length ? groups[0].id : null
  );

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  // crear un permiso nuevo (queda en la lista global, aunque todavía no se use)
  function handleCreatePermission() {
    const nombre = prompt("Nombre visible del permiso (ej: Ver Reportes):");
    if (!nombre) return;

    const codigo = prompt(
      'Código/tag técnico del permiso (ej: "VIEW_REPORTS").'
    );
    if (!codigo) return;

    const id = codigo.trim().toUpperCase().replace(/\s+/g, "_");
    if (permissions.some((p) => p.id === id)) {
      alert("Ya existe un permiso con ese código.");
      return;
    }

    const nuevo = {
      id,
      nombre: nombre.trim(),
      descripcion: "",
    };

    setPermissions((prev) => [...prev, nuevo]);
    alert(
      `Permiso creado: ${id}. Más adelante lo podrás usar en backend/guards para controlar acceso real.`
    );
  }

  // toggle asignación de permiso a grupo
  function togglePermission(groupId, permId) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const has = g.permisoIds.includes(permId);
        return {
          ...g,
          permisoIds: has
            ? g.permisoIds.filter((id) => id !== permId)
            : [...g.permisoIds, permId],
        };
      })
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de grupo + botón nuevo permiso */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Grupo:</span>
          <select
            className="border rounded-lg px-2 py-1 text-sm"
            value={selectedGroupId || ""}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreatePermission}
          className="px-3 py-2 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          + Crear nuevo permiso
        </button>
      </div>

      {!selectedGroup ? (
        <p className="text-sm text-slate-500">
          No hay grupos definidos todavía.
        </p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              {selectedGroup.nombre}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedGroup.descripcion ||
                "Este grupo no tiene descripción definida."}
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Tildá qué permisos tiene este grupo. Los permisos no se borran de la
            base, solo se asignan o se quitan del grupo.
          </p>

          <div className="border rounded-xl divide-y max-h-72 overflow-y-auto">
            {permissions.map((p) => {
              const checked = selectedGroup.permisoIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked}
                    onChange={() => togglePermission(selectedGroup.id, p.id)}
                  />
                  <div>
                    <div className="text-xs font-medium text-slate-800">
                      {p.nombre}
                      <span className="ml-2 text-[11px] text-slate-400">
                        ({p.id})
                      </span>
                    </div>
                    {p.descripcion && (
                      <div className="text-[11px] text-slate-500">
                        {p.descripcion}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
            {permissions.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-500">
                Todavía no hay permisos definidos.
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Más adelante, en el backend / guards de frontend, podés usar el
            código del permiso (por ejemplo, MANAGE_USERS o VIEW_AUDIT) para
            mostrar/ocultar secciones reales.
          </p>
        </div>
      )}
    </div>
  );
}

// ===== Modal usuario =====

function UserModal({
  onClose,
  onSubmit,
  email,
  setEmail,
  role,
  setRole,
  active,
  setActive,
  editing,
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          {editing ? "Editar usuario" : "Nuevo usuario"}
        </h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input
              type="email"
              className="border rounded-lg px-2 py-1 w-full text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Rol / Grupo
            </label>
            <select
              className="border rounded-lg px-2 py-1 w-full text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="ADMIN">Admin</option>
              <option value="TECNICO">Técnico</option>
              <option value="OWNER">Propietario</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            <label
              htmlFor="active"
              className="text-xs text-slate-600 select-none"
            >
              Usuario activo
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-full text-xs border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-full text-xs bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              {editing ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== Helpers tabla =====

function Th({ children }) {
  return (
    <th className="px-3 py-2 text-left font-medium text-xs md:text-sm">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="px-3 py-2 text-xs md:text-sm align-middle">{children}</td>
  );
}
