import { useEffect, useMemo, useState } from "react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../infra/http/users";
import { fetchGroups } from "../../infra/http/groups";
import {
  fetchPermissions,
  createPermission,
  addPermissionToGroup,
  removePermissionFromGroup,
} from "../../infra/http/permissions";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("users"); // "users" | "groups"
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // groupId
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState(""); // groupId
  const [formActive, setFormActive] = useState(true);
  const [groups, setGroups] = useState([]);

  // Cargar usuarios, grupos (con permisos) y permisos
  useEffect(() => {
    (async () => {
      try {
        const [list, grp, perms] = await Promise.all([
          fetchUsers(),
          fetchGroups(),
          fetchPermissions(),
        ]);

        setUsers(list); // [{id,email,groupId,groupName,active,createdAt}]

        // adaptamos grupos para la pestaña "Grupos y permisos"
        setGroups(
          grp.map((g) => ({
            id: g.id,
            nombre: g.name,
            descripcion: g.desc || "",
            // desde backend: permissionCodes: ["VIEW_DASHBOARD", ...]
            permisoIds: g.permissionCodes || [],
          }))
        );

        // adaptamos permisos para UI: usamos code como id y label
        setPermissions(
          perms.map((p) => ({
            id: p.code, // lo usamos como code
            nombre: p.code,
            descripcion: "",
          }))
        );
      } catch (e) {
        console.error(e);
        alert(e.message || "Error cargando usuarios / grupos / permisos");
      }
    })();
  }, []);

  // --- Derivados usuarios ---
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (search && !u.email.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (roleFilter !== "ALL" && u.groupId !== roleFilter) return false;
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
    setFormRole(groups[0]?.id || "");
    setFormActive(true);
    setModalOpen(true);
  }

  function openEditUserModal(user) {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormRole(user.groupId || "");
    setFormActive(user.active);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    if (!formEmail.trim()) {
      alert("El email es obligatorio.");
      return;
    }
    if (!formRole) {
      alert("Debe seleccionar un rol / grupo.");
      return;
    }

    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, {
          email: formEmail.trim(),
          groupId: formRole,
          active: formActive,
        });

        const group = groups.find((g) => g.id === updated.groupId);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === updated.id
              ? {
                  ...u,
                  ...updated,
                  groupName: group ? group.nombre : u.groupName || null,
                }
              : u
          )
        );
      } else {
        const created = await createUser({
          email: formEmail.trim(),
          groupId: formRole,
          active: formActive,
        });

        const group = groups.find((g) => g.id === created.groupId);
        const newUser = {
          ...created,
          groupName: group ? group.nombre : created.groupName || null,
        };

        setUsers((prev) => [newUser, ...prev]);
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando usuario");
    }
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`¿Eliminar al usuario ${user.email}?`)) return;
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error eliminando usuario");
    }
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
          groups={groups}
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
          groups={groups}
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
  groups,
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
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
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
              <Th>Rol / Grupo</Th>
              <Th>Fecha registro</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const d = new Date(u.createdAt);
              const fecha = isNaN(d.getTime())
                ? "-"
                : d.toLocaleDateString();
              const rolLabel = u.groupName || "Sin grupo";

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
    groups.length ? groups[0].id : ""
  );

  const selectedGroup =
    groups.find((g) => g.id === selectedGroupId) || null;

  // crear un permiso nuevo en backend
  async function handleCreatePermission() {
    const nombre = prompt(
      'Código/tag técnico del permiso (ej: "VIEW_REPORTS").'
    );
    if (!nombre) return;

    const code = nombre.trim().toUpperCase().replace(/\s+/g, "_");

    try {
      const perm = await createPermission(code);

      const nuevo = {
        id: perm.code,
        nombre: perm.code,
        descripcion: "",
      };

      setPermissions((prev) => [...prev, nuevo]);
      alert(
        `Permiso creado: ${perm.code}. Ahora podés asignarlo a los grupos.`
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Error creando permiso");
    }
  }

  // toggle asignación de permiso a grupo (backend + estado local)
  async function togglePermission(groupId, permId) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const has = group.permisoIds.includes(permId);

    try {
      if (has) {
        await removePermissionFromGroup(groupId, permId);
      } else {
        await addPermissionToGroup(groupId, permId);
      }

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            permisoIds: has
              ? g.permisoIds.filter((id) => id !== permId)
              : [...g.permisoIds, permId],
          };
        })
      );
    } catch (err) {
      console.error(err);
      alert(
        err.message ||
          "Error actualizando permisos del grupo"
      );
    }
  }

  return (
    <div className="space-y-4">
      {/* Selector de grupo + botón nuevo permiso */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Grupo:</span>
          <select
            className="border rounded-lg px-2 py-1 text-sm"
            value={selectedGroupId}
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
            Tildá qué permisos tiene este grupo. El cambio impacta
            directamente en el backend (tabla GroupPermission).
          </p>

          <div className="border rounded-xl divide-y max-h-72 overflow-y-auto">
            {permissions.map((p) => {
              const checked =
                selectedGroup.permisoIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked}
                    onChange={() =>
                      togglePermission(selectedGroup.id, p.id)
                    }
                  />
                  <div>
                    <div className="text-xs font-medium text-slate-800">
                      {p.nombre}
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
            Estos permisos son los mismos que se usan en{" "}
            <code>currentUser.permissions</code> (ej. MANAGE_USERS,
            VIEW_AUDIT) para controlar el acceso a cada sección.
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
  groups,
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          {editing ? "Editar usuario" : "Nuevo usuario"}
        </h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Email
            </label>
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
              required
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
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
