"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminActionButton,
  EyeIcon,
  PencilIcon,
  PlusIcon,
} from "../../../components/admin/AdminActionButton";
import {
  AdminDataTable,
  createLocalAdminTableFetch,
} from "../../../components/admin/AdminDataTable";
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
import { isApiError } from "../../../lib/api";
import {
  createOrganizationRole,
  getOrganizationRoles,
  getPlatformModules,
  getPlatformOrganizations,
  getPlatformPermissions,
  getPlatformRoles,
  updatePlatformRole,
} from "../../../lib/platform-admin-api";
import { formatRoleContext } from "../../../lib/platform-admin-formatters";
import type {
  PlatformModuleSummary,
  PlatformPermissionSummary,
  PlatformOrganizationSummary,
  PlatformRoleTemplate,
} from "../../../types/platform-admin";

export default function PlatformRolesPage() {
  const { accessToken, isLoading: isAuthLoading, refreshSession, platformContext } =
    useAuth();
  const [roles, setRoles] = useState<PlatformRoleTemplate[]>([]);
  const [organizations, setOrganizations] = useState<PlatformOrganizationSummary[]>([]);
  const [organizationRoles, setOrganizationRoles] = useState<PlatformRoleTemplate[]>([]);
  const [permissions, setPermissions] = useState<PlatformPermissionSummary[]>([]);
  const [modules, setModules] = useState<PlatformModuleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableReloadKey, setTableReloadKey] = useState(0);
  const [selectedRole, setSelectedRole] = useState<PlatformRoleTemplate | null>(null);
  const [overlayMode, setOverlayMode] = useState<"detail" | "edit">("detail");
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    permissionKeys: string[];
  } | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [organizationRoleForm, setOrganizationRoleForm] = useState({
    key: "",
    name: "",
    description: "",
    permissionKeys: [] as string[],
  });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadData() {
    const token = await resolveToken();

    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const [
      rolesResponse,
      permissionsResponse,
      organizationsResponse,
      modulesResponse,
    ] = await Promise.all([
      getPlatformRoles(token),
      getPlatformPermissions(token),
      getPlatformOrganizations(token),
      getPlatformModules(token),
    ]);

    setRoles(rolesResponse);
    setPermissions(permissionsResponse);
    setOrganizations(organizationsResponse);
    setModules(modulesResponse);
  }

  async function fetchRolesTable(input: {
    page: number;
    limit: number;
    search: string;
  }) {
    const token = await resolveToken();

    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const rows = await getPlatformRoles(token);

    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (role, search) =>
        [
          role.key,
          role.name,
          role.description,
          role.context,
          role.scopeKey,
          ...role.permissionKeys,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  async function loadOrganizationRoles(organizationId: string) {
    setSelectedOrganizationId(organizationId);

    if (!organizationId) {
      setOrganizationRoles([]);
      return;
    }

    const token = await resolveToken();

    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const rolesResponse = await getOrganizationRoles(token, organizationId);
    setOrganizationRoles(rolesResponse);
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (isAuthLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await loadData();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar la base de roles.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthLoading, refreshSession]);

  function openRoleDetail(role: PlatformRoleTemplate) {
    setOverlayMode("detail");
    setSelectedRole(role);
  }

  function openRoleEditor(role: PlatformRoleTemplate) {
    setOverlayMode("edit");
    setSelectedRole(role);
    setEditForm({
      name: role.name,
      description: role.description ?? "",
      permissionKeys: role.permissionKeys,
    });
  }

  async function handleUpdateRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRole || !editForm) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await resolveToken();

      if (!token) {
        throw new Error("No se pudo restaurar la sesion del superadmin.");
      }

      await updatePlatformRole(token, selectedRole.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        permissionKeys: editForm.permissionKeys,
      });

      await loadData();
      setTableReloadKey((current) => current + 1);
      setSelectedRole(null);
      setEditForm(null);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo actualizar el rol base.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateOrganizationRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedOrganizationId) {
      setError("Selecciona una organizacion antes de crear un rol personalizado.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await resolveToken();

      if (!token) {
        throw new Error("No se pudo restaurar la sesion del superadmin.");
      }

      await createOrganizationRole(token, selectedOrganizationId, {
        key: organizationRoleForm.key,
        name: organizationRoleForm.name,
        description: organizationRoleForm.description || undefined,
        permissionKeys: organizationRoleForm.permissionKeys,
      });

      setOrganizationRoleForm({
        key: "",
        name: "",
        description: "",
        permissionKeys: [],
      });
      await loadOrganizationRoles(selectedOrganizationId);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo crear el rol personalizado.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const permissionRows = useMemo(
    () => buildPermissionMatrixRows(modules, permissions),
    [modules, permissions],
  );
  const organizationPermissionRows = useMemo(
    () =>
      buildPermissionMatrixRows(
        modules,
        permissions.filter((permission) => permission.audience !== "PLATFORM"),
      ),
    [modules, permissions],
  );
  const selectedRolePermissionRows = useMemo(
    () =>
      buildPermissionMatrixRowsForKeys(
        modules,
        permissions,
        selectedRole?.permissionKeys ?? [],
      ),
    [modules, permissions, selectedRole?.permissionKeys],
  );

  function toggleEditPermission(permissionKey: string) {
    setEditForm((current) =>
      current
        ? {
            ...current,
            permissionKeys: current.permissionKeys.includes(permissionKey)
              ? current.permissionKeys.filter((key) => key !== permissionKey)
              : [...current.permissionKeys, permissionKey],
          }
        : current,
    );
  }

  function toggleOrganizationRolePermission(permissionKey: string) {
    setOrganizationRoleForm((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((key) => key !== permissionKey)
        : [...current.permissionKeys, permissionKey],
    }));
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Superadmin"
        title="Roles base de Kapos"
        description="Aqui editas roles reales del sistema: plataforma, owners, administradores y roles delegables a organizaciones."
        stats={[
          { label: "Roles base", value: String(roles.length), hint: "Roles activos dentro del sistema.", tone: "dark" },
          { label: "Roles platform", value: String(roles.filter((role) => role.context === "PLATFORM").length), hint: "Gobierno maestro de Kapos.", tone: "accent" },
          { label: "Roles organization", value: String(roles.filter((role) => role.context === "ORGANIZATION").length), hint: "Delegables a clientes y sus equipos." },
        ]}
      />

      {error ? (
        <AdminMessage title="No pudimos cargar los roles base" description={error} tone="warn" />
      ) : null}

      <PanelCard
        title="Matriz de roles"
        description="Cada rol base queda unido a un conjunto controlado de permisos, listos para delegarse sin romper la arquitectura."
      >
        {isLoading ? (
          <AdminMessage title="Cargando roles base" description="Estamos trayendo los roles y permisos reales de Kapos." />
        ) : (
          <AdminDataTable
            fetchData={fetchRolesTable}
            reloadKey={tableReloadKey}
            rowKey={(row) => row.id}
            permissionKeys={platformContext?.permissionKeys ?? []}
            searchPlaceholder="Buscar por rol, key, contexto o permiso..."
            emptyTitle="No hay roles base"
            emptyDescription="Debes mantener roles base para que las memberships y accesos se deleguen bien."
            columns={[
              {
                key: "rol",
                label: "Rol",
                render: (role) => (
                  <div>
                    <p className="font-semibold text-[#0D0D0D]">{role.name}</p>
                    <p className="text-xs text-[#A1A1A1]">{role.key}</p>
                  </div>
                ),
              },
              {
                key: "contexto",
                label: "Contexto",
                render: (role) => (
                  <Tag tone={role.context === "PLATFORM" ? "dark" : "accent"}>
                    {formatRoleContext(role.context)}
                  </Tag>
                ),
              },
              {
                key: "permisos",
                label: "Permisos",
                align: "center",
                render: (role) => role.permissionCount,
              },
              {
                key: "miembros",
                label: "Miembros",
                align: "center",
                render: (role) => role.memberCount,
              },
            ]}
            actions={[
              { label: "Ver detalle", icon: <EyeIcon />, onClick: (role) => openRoleDetail(role) },
              { label: "Editar", permission: "platform.roles.update", icon: <PencilIcon />, onClick: (role) => openRoleEditor(role) },
            ]}
          />
        )}
      </PanelCard>

      <PanelCard
        title="Roles personalizados por organizacion"
        description="Aqui puedes crear variantes para un cliente concreto sin alterar los roles base del sistema."
      >
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <form className="space-y-4" onSubmit={handleCreateOrganizationRole}>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Organizacion</span>
              <select
                className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                value={selectedOrganizationId}
                onChange={(event) => void loadOrganizationRoles(event.target.value)}
              >
                <option value="">Selecciona una organizacion</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.tradeName ?? organization.legalName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Key del rol</span>
              <input
                className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                placeholder="cashier.with_discounts"
                value={organizationRoleForm.key}
                onChange={(event) =>
                  setOrganizationRoleForm((current) => ({
                    ...current,
                    key: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Nombre</span>
              <input
                className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                placeholder="Cajero con descuentos"
                value={organizationRoleForm.name}
                onChange={(event) =>
                  setOrganizationRoleForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Descripcion</span>
              <input
                className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                placeholder="Puede operar pedidos y aplicar descuentos autorizados."
                value={organizationRoleForm.description}
                onChange={(event) =>
                  setOrganizationRoleForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <AdminPermissionMatrix
              rows={organizationPermissionRows}
              selectedPermissionKeys={organizationRoleForm.permissionKeys}
              onToggle={toggleOrganizationRolePermission}
              emptyTitle="Sin permisos de organizacion"
              emptyDescription="No hay permisos disponibles para roles de organizacion."
              minHeightClassName="max-h-72"
            />
            <div className="flex justify-end">
              <AdminActionButton
                type="submit"
                tone="accent"
                icon={<PlusIcon />}
                disabled={isSubmitting || !selectedOrganizationId}
              >
                {isSubmitting ? "Creando..." : "Crear rol personalizado"}
              </AdminActionButton>
            </div>
          </form>

          <div className="space-y-3">
            {organizationRoles.length > 0 ? (
              organizationRoles.map((role) => (
                <article key={role.id} className="rounded-[24px] border border-[#E4E4E4] bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#0D0D0D]">{role.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#A1A1A1]">
                        {role.scopeKey}
                      </p>
                    </div>
                    <Tag tone={role.isSystem === false ? "accent" : "soft"}>
                      {role.isSystem === false ? "Personalizado" : "Base"}
                    </Tag>
                  </div>
                  <p className="mt-3 text-sm text-[#667053]">
                    {role.permissionCount} permisos · {role.memberCount} miembros
                  </p>
                </article>
              ))
            ) : (
              <AdminMessage
                title="Selecciona una organizacion"
                description="Cuando elijas un cliente veras sus roles base disponibles y sus roles personalizados."
              />
            )}
          </div>
        </div>
      </PanelCard>

      <AdminOverlayPanel
        open={Boolean(selectedRole)}
        onClose={() => setSelectedRole(null)}
        eyebrow="Rol base"
        title={selectedRole?.name ?? "Detalle de rol"}
        description="Este panel te permite revisar o ajustar los permisos que sostienen este rol del sistema."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedRole(null)}>
              Cerrar
            </AdminActionButton>
            {overlayMode === "edit" ? (
              <AdminActionButton
                tone="primary"
                disabled={isSubmitting}
                onClick={() => {
                  const formElement = document.getElementById("platform-role-edit-form") as HTMLFormElement | null;
                  formElement?.requestSubmit();
                }}
              >
                {isSubmitting ? "Guardando..." : "Guardar rol"}
              </AdminActionButton>
            ) : (
              <AdminActionButton
                tone="primary"
                onClick={() => selectedRole && openRoleEditor(selectedRole)}
              >
                Editar rol
              </AdminActionButton>
            )}
          </div>
        }
      >
        {selectedRole ? (
          overlayMode === "edit" && editForm ? (
            <form
              id="platform-role-edit-form"
              className="space-y-5"
              onSubmit={handleUpdateRole}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#0D0D0D]">Nombre</span>
                  <input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.name} onChange={(event) => setEditForm((current) => current ? { ...current, name: event.target.value } : current)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#0D0D0D]">Descripcion</span>
                  <input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.description} onChange={(event) => setEditForm((current) => current ? { ...current, description: event.target.value } : current)} />
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#0D0D0D]">Permisos activos</p>
                <AdminPermissionMatrix
                  rows={permissionRows}
                  selectedPermissionKeys={editForm.permissionKeys}
                  onToggle={toggleEditPermission}
                  minHeightClassName="max-h-[520px]"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[28px] border border-[#e7edd5] bg-white/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#00C70D]">
                    Rol
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[#18200f]">
                    {selectedRole.name}
                  </p>
                  <p className="mt-2 text-sm text-[#535353]">
                    {selectedRole.description ?? "Sin descripcion"}
                  </p>
                </article>
                <article className="rounded-[28px] border border-[#e7edd5] bg-[linear-gradient(135deg,#fcffe9_0%,#f6fadf_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#00C70D]">
                    Contexto
                  </p>
                  <div className="mt-4">
                    <Tag tone={selectedRole.context === "PLATFORM" ? "dark" : "accent"}>
                      {formatRoleContext(selectedRole.context)}
                    </Tag>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#535353]">
                    {selectedRole.permissionCount} permisos y {selectedRole.memberCount} miembros asociados.
                  </p>
                </article>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a9668]">
                  Permisos ligados
                </p>
                <AdminPermissionMatrix
                  rows={selectedRolePermissionRows}
                  selectedPermissionKeys={selectedRole.permissionKeys}
                  emptyTitle="Sin permisos ligados"
                  emptyDescription="Este rol no tiene permisos ligados todavia."
                  minHeightClassName="max-h-[520px]"
                />
              </div>
            </div>
          )
        ) : null}
      </AdminOverlayPanel>
    </section>
  );
}
