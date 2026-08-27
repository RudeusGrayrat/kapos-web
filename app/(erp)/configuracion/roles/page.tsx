"use client";

import { useState } from "react";
import {
  AdminActionButton,
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "../../../components/admin/AdminActionButton";
import { AdminDataTable } from "../../../components/admin/AdminDataTable";
import {
  AdminMessage,
  AdminModuleHeader,
  PanelCard,
  Tag,
} from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import {
  AdminPermissionMatrix,
  buildPermissionMatrixRows,
  buildPermissionMatrixRowsForKeys,
} from "../../../components/admin/AdminPermissionMatrix";
import { useAuth } from "../../../context/auth-context";
import {
  archiveInternalRole,
  createInternalRole,
  getAssignableOrganizationPermissions,
  getInternalRoles,
  updateInternalRole,
} from "../../../lib/erp-api";
import type {
  InternalRoleSummary,
  OrganizationPermissionSummary,
} from "../../../types/erp";

type RoleForm = {
  key: string;
  name: string;
  description: string;
  permissionKeys: string[];
};

function emptyRoleForm(): RoleForm {
  return { key: "", name: "", description: "", permissionKeys: [] };
}

export default function ConfigRolesPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [roles, setRoles] = useState<InternalRoleSummary[]>([]);
  const [permissions, setPermissions] = useState<OrganizationPermissionSummary[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState<"table" | "create">("table");
  const [form, setForm] = useState<RoleForm>(emptyRoleForm());
  const [selectedRole, setSelectedRole] = useState<InternalRoleSummary | null>(null);
  const [editForm, setEditForm] = useState<RoleForm>(emptyRoleForm());
  const [error, setError] = useState<string | null>(null);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadPermissions() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return [];
    const rows = await getAssignableOrganizationPermissions({
      accessToken: token,
      organizationId: activeOrganizationId,
    });
    setPermissions(rows);
    return rows;
  }

  async function fetchRoles(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const [response] = await Promise.all([
      getInternalRoles({
        accessToken: token,
        organizationId: activeOrganizationId,
        page: input.page,
        limit: input.limit,
        search: input.search,
      }),
      loadPermissions(),
    ]);
    setRoles(response.data);
    return { data: response.data, total: response.total };
  }

  function togglePermission(target: "create" | "edit", permissionKey: string) {
    const updater = (current: RoleForm) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((key) => key !== permissionKey)
        : [...current.permissionKeys, permissionKey],
    });

    if (target === "create") setForm(updater);
    else setEditForm(updater);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await createInternalRole({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          key: form.key,
          name: form.name,
          description: form.description,
          permissionKeys: form.permissionKeys,
        },
      });
      setForm(emptyRoleForm());
      setMode("table");
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear el rol.");
    }
  }

  function openEditor(role: InternalRoleSummary) {
    setSelectedRole(role);
    setEditForm({
      key: role.key,
      name: role.name,
      description: role.description ?? "",
      permissionKeys: role.permissionKeys,
    });
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedRole) return;
    setError(null);
    try {
      await updateInternalRole({
        accessToken: token,
        organizationId: activeOrganizationId,
        roleId: selectedRole.id,
        body: {
          name: editForm.name,
          description: editForm.description,
          permissionKeys: editForm.permissionKeys,
        },
      });
      setSelectedRole(null);
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo editar el rol.");
    }
  }

  async function handleArchive(role: InternalRoleSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || role.isSystem) return;
    setError(null);
    try {
      await archiveInternalRole({
        accessToken: token,
        organizationId: activeOrganizationId,
        roleId: role.id,
      });
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo archivar el rol.");
    }
  }

  const permissionRows = buildPermissionMatrixRows([], permissions);
  const selectedRolePermissionRows = buildPermissionMatrixRowsForKeys(
    [],
    permissions,
    editForm.permissionKeys,
  );

  function renderPermissionSelector(target: "create" | "edit", values: string[]) {
    return (
      <AdminPermissionMatrix
        rows={permissionRows}
        selectedPermissionKeys={values}
        minHeightClassName="min-h-64"
        emptyTitle="Sin permisos delegables"
        emptyDescription="Tu usuario aun no tiene permisos disponibles para delegar en roles."
        onToggle={(permissionKey) => togglePermission(target, permissionKey)}
      />
    );
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Configuracion"
        title="Roles internos"
        description="Crea roles personalizados para la organizacion activa sin delegar permisos superiores a los tuyos."
        action={
          <div className="flex gap-2">
            {mode === "create" ? (
              <AdminActionButton tone="ghost" icon={<ArrowLeftIcon />} onClick={() => setMode("table")}>
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton tone="primary" active={mode === "create"} icon={<PlusIcon />} onClick={() => setMode("create")}>Crear rol</AdminActionButton>
          </div>
        }
        stats={[
          { label: "Roles visibles", value: String(roles.length), hint: "Sistema y personalizados.", tone: "dark" },
          { label: "Personalizados", value: String(roles.filter((role) => !role.isSystem).length), hint: "Creados por la organizacion.", tone: "accent" },
          { label: "Permisos delegables", value: String(permissions.length), hint: "Limite real del owner/admin." },
        ]}
      />
      {error ? <AdminMessage title="No pudimos completar la accion" description={error} tone="warn" /> : null}

      {mode === "create" ? (
        <PanelCard title="Crear rol personalizado" description="Ejemplo: cajero-sede-centro, supervisor-turno o almacen-basico.">
          <form className="space-y-5" onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Key</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm lowercase outline-none transition focus:border-[#00C70D]" placeholder="cajero.personalizado" value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value.toLowerCase() }))} required /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nombre</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" placeholder="Cajero personalizado" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            </div>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Descripcion</span><textarea className="min-h-24 w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
            {renderPermissionSelector("create", form.permissionKeys)}
            <div className="flex justify-end gap-3">
              <AdminActionButton tone="ghost" onClick={() => setMode("table")}>Cancelar</AdminActionButton>
              <AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Guardar rol</AdminActionButton>
            </div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Tabla de roles" description="Los roles de sistema se usan como base; solo los personalizados se editan o archivan aqui.">
          <AdminDataTable
            fetchData={fetchRoles}
            reloadKey={`${activeOrganizationId ?? ""}-${reloadKey}`}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar rol..."
            emptyTitle="Aun no hay roles"
            emptyDescription="Crea un rol personalizado para esta organizacion."
            columns={[
              { key: "name", label: "Rol", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.name}</p><p className="text-xs text-[#A1A1A1]">{row.key}</p></div> },
              { key: "type", label: "Tipo", render: (row) => <Tag tone={row.isSystem ? "dark" : "accent"}>{row.isSystem ? "Sistema" : "Personalizado"}</Tag> },
              { key: "permissions", label: "Permisos", align: "center", render: (row) => row.permissionCount },
              { key: "members", label: "Usuarios", align: "center", render: (row) => row.memberCount },
            ]}
            actions={[
              { label: "Editar", permission: "settings.roles.update", icon: <PencilIcon />, disabled: false, onClick: openEditor },
              { label: "Archivar", permission: "settings.roles.delete", tone: "warn", icon: <TrashIcon />, onClick: handleArchive },
            ]}
          />
        </PanelCard>
      )}

      <AdminOverlayPanel
        open={Boolean(selectedRole)}
        onClose={() => setSelectedRole(null)}
        eyebrow="Rol interno"
        title={selectedRole?.isSystem ? "Ver rol de sistema" : "Editar rol personalizado"}
        description={selectedRole?.isSystem ? "Los roles base no se editan desde la organizacion; crea uno personalizado si necesitas variantes." : "Actualiza nombre, descripcion y permisos delegables."}
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedRole(null)}>Cerrar</AdminActionButton>
            {!selectedRole?.isSystem ? (
              <AdminActionButton tone="primary" onClick={() => (document.getElementById("internal-role-edit-form") as HTMLFormElement | null)?.requestSubmit()}>Guardar cambios</AdminActionButton>
            ) : null}
          </div>
        }
      >
        <form id="internal-role-edit-form" className="space-y-5" onSubmit={handleUpdate}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Key</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-[#f8faf2] px-4 py-3 text-sm outline-none" value={editForm.key} disabled /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nombre</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} disabled={selectedRole?.isSystem} required /></label>
          </div>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Descripcion</span><textarea className="min-h-24 w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} disabled={selectedRole?.isSystem} /></label>
          {selectedRole?.isSystem ? (
            <AdminPermissionMatrix
              rows={selectedRolePermissionRows}
              selectedPermissionKeys={editForm.permissionKeys}
              emptyTitle="Sin permisos ligados"
              emptyDescription="Este rol no tiene permisos ligados todavia."
              minHeightClassName="max-h-80"
            />
          ) : renderPermissionSelector("edit", editForm.permissionKeys)}
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
