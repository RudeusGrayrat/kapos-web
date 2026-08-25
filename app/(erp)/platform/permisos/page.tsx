"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminActionButton,
  ArrowLeftIcon,
  EyeIcon,
  PlusIcon,
} from "../../../components/admin/AdminActionButton";
import {
  AdminMessage,
  AdminModuleHeader,
  PanelCard,
  Tag,
} from "../../../components/admin/AdminBlocks";
import {
  AdminDataTable,
  createLocalAdminTableFetch,
} from "../../../components/admin/AdminDataTable";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import { isApiError } from "../../../lib/api";
import {
  createPlatformPermission,
  getPlatformModules,
  getPlatformPermissions,
  updatePlatformPermission,
} from "../../../lib/platform-admin-api";
import {
  formatPermissionScope,
  humanizeCatalogKey,
} from "../../../lib/platform-admin-formatters";
import type {
  PlatformModuleSummary,
  PlatformPermissionSummary,
} from "../../../types/platform-admin";

export default function PlatformPermissionsPage() {
  const { accessToken, isLoading: isAuthLoading, refreshSession, platformContext } =
    useAuth();
  const [permissions, setPermissions] = useState<PlatformPermissionSummary[]>([]);
  const [modules, setModules] = useState<PlatformModuleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [tableReloadKey, setTableReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [selectedPermission, setSelectedPermission] =
    useState<PlatformPermissionSummary | null>(null);
  const [overlayMode, setOverlayMode] = useState<"detail" | "edit">("detail");
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    moduleKey: string;
    submoduleKey: string;
    scope: "OWN" | "BRANCH" | "ORGANIZATION" | "PLATFORM";
    audience: "PLATFORM" | "ORGANIZATION" | "BOTH";
  } | null>(null);
  const [form, setForm] = useState<{
    key: string;
    name: string;
    description: string;
    moduleKey: string;
    submoduleKey: string;
    scope: "OWN" | "BRANCH" | "ORGANIZATION" | "PLATFORM";
    audience: "PLATFORM" | "ORGANIZATION" | "BOTH";
  }>({
    key: "",
    name: "",
    description: "",
    moduleKey: "",
    submoduleKey: "",
    scope: "ORGANIZATION",
    audience: "ORGANIZATION",
  });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadData() {
    const token = await resolveToken();
    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }
    const [permissionsResponse, modulesResponse] = await Promise.all([
      getPlatformPermissions(token),
      getPlatformModules(token),
    ]);
    setPermissions(permissionsResponse);
    setModules(modulesResponse);
  }

  async function fetchPermissionsTable(input: {
    page: number;
    limit: number;
    search: string;
  }) {
    const token = await resolveToken();
    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const rows = await getPlatformPermissions(token);

    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (permission, search) =>
        [
          permission.key,
          permission.name,
          permission.description,
          permission.moduleKey,
          permission.submoduleKey,
          permission.scope,
          permission.audience,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (isAuthLoading) return;
      setIsLoading(true);
      setError(null);
      try {
        await loadData();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el catalogo de permisos.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthLoading, refreshSession]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmitMessage(null);
    try {
      const token = await resolveToken();
      if (!token) throw new Error("No se pudo restaurar la sesion del superadmin.");
      await createPlatformPermission(token, {
        key: form.key,
        name: form.name,
        description: form.description || undefined,
        moduleKey: form.moduleKey || undefined,
        submoduleKey: form.submoduleKey || undefined,
        scope: form.scope,
        audience: form.audience,
      });
      setForm({
        key: "",
        name: "",
        description: "",
        moduleKey: "",
        submoduleKey: "",
        scope: "ORGANIZATION",
        audience: "ORGANIZATION",
      });
      setSubmitMessage("Permiso creado correctamente.");
      setViewMode("table");
      await loadData();
      setTableReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo crear el permiso.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdatePermission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPermission || !editForm) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmitMessage(null);

    try {
      const token = await resolveToken();
      if (!token) throw new Error("No se pudo restaurar la sesion del superadmin.");

      await updatePlatformPermission(token, selectedPermission.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        moduleKey: editForm.moduleKey || undefined,
        submoduleKey: editForm.submoduleKey || undefined,
        scope: editForm.scope,
        audience: editForm.audience,
      });

      await loadData();
      setTableReloadKey((current) => current + 1);
      setSelectedPermission(null);
      setEditForm(null);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo actualizar el permiso.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openPermissionDetail(permission: PlatformPermissionSummary) {
    setOverlayMode("detail");
    setSelectedPermission(permission);
  }

  function openPermissionEditor(permission: PlatformPermissionSummary) {
    setOverlayMode("edit");
    setSelectedPermission(permission);
    setEditForm({
      name: permission.name,
      description: permission.description ?? "",
      moduleKey: permission.moduleKey ?? "",
      submoduleKey: permission.submoduleKey ?? "",
      scope: permission.scope,
      audience: permission.audience,
    });
  }

  const selectedModule = modules.find((moduleItem) => moduleItem.key === form.moduleKey);

  const groupedPermissions = useMemo(
    () =>
      Object.entries(
        permissions.reduce<Record<string, PlatformPermissionSummary[]>>(
          (acc, permission) => {
            const groupKey = `${permission.moduleKey ?? "sin-modulo"}__${permission.submoduleKey ?? "sin-submodulo"}`;
            acc[groupKey] = acc[groupKey] ?? [];
            acc[groupKey].push(permission);
            return acc;
          },
          {},
        ),
      ),
    [permissions],
  );

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Superadmin"
        title="Permisos, llaves y alcance"
        description="Esta vista define el corazon de Kapos: que puede crear, editar, leer o delegar cada rol y hasta donde alcanza ese permiso."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? (
              <AdminActionButton
                type="button"
                onClick={() => setViewMode("table")}
                icon={<ArrowLeftIcon />}
                tone="ghost"
              >
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton
              type="button"
              onClick={() => setViewMode("create")}
              icon={<PlusIcon />}
              tone="secondary"
              active={viewMode === "create"}
            >
              Crear permiso
            </AdminActionButton>
          </div>
        }
        statsColumnsClassName="md:grid-cols-4"
        stats={[
          { label: "Permisos base", value: String(permissions.length), hint: "Inventario real de permisos sembrados en Kapos." },
          { label: "Permisos de plataforma", value: String(permissions.filter((permission) => permission.scope === "PLATFORM").length), hint: "Solo visibles para el gobierno maestro de la plataforma.", tone: "dark" },
          { label: "Permisos de organizacion", value: String(permissions.filter((permission) => permission.scope === "ORGANIZATION").length), hint: "Se delegan a owners y admins del cliente.", tone: "accent" },
          { label: "Permisos de sede", value: String(permissions.filter((permission) => permission.scope === "BRANCH").length), hint: "Controlan acciones limitadas a una sucursal concreta." },
        ]}
      />

      {error ? (
        <AdminMessage title="No pudimos cargar los permisos" description={error} tone="warn" />
      ) : null}

      <PanelCard
        title={viewMode === "create" ? "Crear permiso" : "Mapa de permisos"}
        description={
          viewMode === "create"
            ? "Alta real de permisos atomicos para una arquitectura elegante y delegable."
            : "Base visual para mantener un sistema elegante: permisos atomicos, claros y delegables sin reventar la arquitectura."
        }
      >
        {viewMode === "create" ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Key</span>
              <input
                required
                className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm lowercase outline-none transition focus:border-[#00C70D]"
                placeholder="platform.organizations.read"
                value={form.key}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    key: event.target.value.toLowerCase(),
                  }))
                }
              />
              <p className="text-xs leading-5 text-[#A1A1A1]">
                Usa una llave tecnica tipo contexto.recurso.accion. Ejemplos: platform.users.read, settings.roles.update.
              </p>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Nombre</span>
              <input
                required
                className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                placeholder="Ver organizaciones"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Descripcion</span>
              <input
                className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                placeholder="Permite listar las organizaciones registradas en la plataforma."
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Modulo</span>
              <select
                className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                value={form.moduleKey}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    moduleKey: event.target.value,
                    submoduleKey: "",
                  }))
                }
              >
                <option value="">Sin modulo</option>
                {modules.map((moduleItem) => (
                  <option key={moduleItem.id} value={moduleItem.key}>
                    {moduleItem.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Submodulo</span>
              <select
                className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                value={form.submoduleKey}
                onChange={(event) =>
                  setForm((current) => ({ ...current, submoduleKey: event.target.value }))
                }
              >
                <option value="">Sin submodulo</option>
                {selectedModule?.submodules.map((submodule) => (
                  <option key={submodule.id} value={submodule.key}>
                    {submodule.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Scope</span>
              <select
                className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                value={form.scope}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scope: event.target.value as "OWN" | "BRANCH" | "ORGANIZATION" | "PLATFORM",
                  }))
                }
              >
                <option value="ORGANIZATION">ORGANIZATION</option>
                <option value="PLATFORM">PLATFORM</option>
                <option value="BRANCH">BRANCH</option>
                <option value="OWN">OWN</option>
              </select>
              <p className="text-xs leading-5 text-[#A1A1A1]">
                Scope define hasta donde llega el permiso: propio, sede, toda la organizacion o toda la plataforma.
              </p>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Audience</span>
              <select
                className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                value={form.audience}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    audience: event.target.value as "PLATFORM" | "ORGANIZATION" | "BOTH",
                  }))
                }
              >
                <option value="ORGANIZATION">ORGANIZATION</option>
                <option value="PLATFORM">PLATFORM</option>
                <option value="BOTH">BOTH</option>
              </select>
              <p className="text-xs leading-5 text-[#A1A1A1]">
                Audience define si este permiso pertenece al mundo platform, organization o a ambos.
              </p>
            </label>

            {submitMessage ? (
              <div className="md:col-span-2">
                <AdminMessage title="Listo" description={submitMessage} tone="accent" />
              </div>
            ) : null}

            <div className="md:col-span-2 flex justify-end">
              <AdminActionButton
                type="submit"
                disabled={isSubmitting}
                tone="primary"
                icon={<PlusIcon />}
              >
                {isSubmitting ? "Creando..." : "Guardar permiso"}
              </AdminActionButton>
            </div>
          </form>
        ) : isLoading ? (
          <AdminMessage
            title="Cargando permisos"
            description="Estamos leyendo el catalogo real de permisos maestros desde la base de Kapos."
          />
        ) : (
          <div className="space-y-4">
            <AdminDataTable
              fetchData={fetchPermissionsTable}
              reloadKey={tableReloadKey}
              rowKey={(row) => row.id}
              permissionKeys={platformContext?.permissionKeys ?? []}
              searchPlaceholder="Buscar por permiso, key, modulo, scope..."
              emptyTitle="Aun no hay permisos registrados"
              emptyDescription="Crea el primer permiso atomico para empezar a gobernar modulos, roles y alcances."
              columns={[
                {
                  key: "permiso",
                  label: "Permiso",
                  render: (row) => (
                    <div>
                      <p className="font-semibold text-[#0D0D0D]">{row.name}</p>
                      <p className="text-xs text-[#A1A1A1]">{row.key}</p>
                    </div>
                  ),
                },
                {
                  key: "modulo",
                  label: "Modulo",
                  render: (row) => humanizeCatalogKey(row.moduleKey),
                },
                {
                  key: "submodulo",
                  label: "Submodulo",
                  render: (row) => humanizeCatalogKey(row.submoduleKey),
                },
                {
                  key: "scope",
                  label: "Scope",
                  render: (row) => (
                    <Tag
                      tone={
                        row.scope === "PLATFORM"
                          ? "dark"
                          : row.scope === "ORGANIZATION"
                            ? "accent"
                            : "warn"
                      }
                    >
                      {formatPermissionScope(row.scope)}
                    </Tag>
                  ),
                },
              ]}
              actions={[
                {
                  label: "Ver detalle",
                  icon: <EyeIcon />,
                  onClick: (row) => openPermissionDetail(row),
                },
                {
                  label: "Editar",
                  permission: "platform.permissions.update",
                  onClick: (row) => openPermissionEditor(row),
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              {groupedPermissions.map(([groupKey, groupedItems]) => {
                const [moduleName, submoduleName] = groupKey.split("__");
                return (
                  <article
                    key={groupKey}
                    className="rounded-[26px] border border-[#E4E4E4] bg-[#F8F8F8] p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#1a210f]">
                        {humanizeCatalogKey(moduleName)}
                      </h3>
                      <Tag tone="soft">{humanizeCatalogKey(submoduleName)}</Tag>
                    </div>
                    <div className="mt-4 space-y-3">
                      {groupedItems.map((permission) => (
                        <div
                          key={permission.id}
                          className="rounded-[20px] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(17,17,17,0.04)]"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[#1a210f]">{permission.name}</p>
                            <Tag
                              tone={
                                permission.scope === "PLATFORM"
                                  ? "dark"
                                  : permission.scope === "ORGANIZATION"
                                    ? "accent"
                                    : "warn"
                              }
                            >
                              {formatPermissionScope(permission.scope)}
                            </Tag>
                          </div>
                          {permission.description ? (
                            <p className="mt-2 text-sm leading-6 text-[#5d664d]">
                              {permission.description}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#84925d]">
                            {permission.key}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </PanelCard>

      <AdminOverlayPanel
        open={Boolean(selectedPermission)}
        onClose={() => setSelectedPermission(null)}
        eyebrow="Permiso"
        title={selectedPermission?.name ?? "Detalle de permiso"}
        description="Este panel te ayuda a revisar el tipo de permiso, donde vive y hasta donde debe llegar antes de delegarlo a un rol."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedPermission(null)}>
              Cerrar
            </AdminActionButton>
            {overlayMode === "edit" ? (
              <AdminActionButton
                tone="primary"
                disabled={isSubmitting}
                onClick={() => {
                  const formElement = document.getElementById("platform-permission-edit-form") as HTMLFormElement | null;
                  formElement?.requestSubmit();
                }}
              >
                {isSubmitting ? "Guardando..." : "Guardar permiso"}
              </AdminActionButton>
            ) : (
              <AdminActionButton
                tone="primary"
                onClick={() =>
                  selectedPermission && openPermissionEditor(selectedPermission)
                }
              >
                Editar permiso
              </AdminActionButton>
            )}
          </div>
        }
      >
        {selectedPermission ? (
          overlayMode === "edit" && editForm ? (
            <form
              id="platform-permission-edit-form"
              className="grid gap-4 md:grid-cols-2"
              onSubmit={handleUpdatePermission}
            >
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nombre</span><input className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.name} onChange={(event) => setEditForm((current) => current ? { ...current, name: event.target.value } : current)} required /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Modulo</span><select className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.moduleKey} onChange={(event) => setEditForm((current) => current ? { ...current, moduleKey: event.target.value, submoduleKey: "" } : current)}><option value="">Sin modulo</option>{modules.map((moduleItem) => (<option key={moduleItem.id} value={moduleItem.key}>{moduleItem.name}</option>))}</select></label>
              <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#0D0D0D]">Descripcion</span><input className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.description} onChange={(event) => setEditForm((current) => current ? { ...current, description: event.target.value } : current)} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Submodulo</span><select className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.submoduleKey} onChange={(event) => setEditForm((current) => current ? { ...current, submoduleKey: event.target.value } : current)}><option value="">Sin submodulo</option>{modules.find((moduleItem) => moduleItem.key === editForm.moduleKey)?.submodules.map((submodule) => (<option key={submodule.id} value={submodule.key}>{submodule.name}</option>))}</select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Scope</span><select className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.scope} onChange={(event) => setEditForm((current) => current ? { ...current, scope: event.target.value as typeof editForm.scope } : current)}><option value="ORGANIZATION">ORGANIZATION</option><option value="PLATFORM">PLATFORM</option><option value="BRANCH">BRANCH</option><option value="OWN">OWN</option></select></label>
              <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#0D0D0D]">Audience</span><select className="w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.audience} onChange={(event) => setEditForm((current) => current ? { ...current, audience: event.target.value as typeof editForm.audience } : current)}><option value="ORGANIZATION">ORGANIZATION</option><option value="PLATFORM">PLATFORM</option><option value="BOTH">BOTH</option></select></label>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[28px] border border-[#e7edd5] bg-white/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#00C70D]">
                    Llave
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[#18200f]">
                    {selectedPermission.name}
                  </p>
                  <p className="mt-2 text-sm text-[#535353]">{selectedPermission.key}</p>
                </article>

                <article className="rounded-[28px] border border-[#e7edd5] bg-[linear-gradient(135deg,#fcffe9_0%,#f6fadf_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#00C70D]">
                    Alcance
                  </p>
                  <div className="mt-4">
                    <Tag
                      tone={
                        selectedPermission.scope === "PLATFORM"
                          ? "dark"
                          : selectedPermission.scope === "ORGANIZATION"
                            ? "accent"
                            : "warn"
                      }
                    >
                      {formatPermissionScope(selectedPermission.scope)}
                    </Tag>
                  </div>
                  {selectedPermission.description ? (
                    <p className="mt-4 text-sm leading-7 text-[#535353]">
                      {selectedPermission.description}
                    </p>
                  ) : null}
                </article>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[24px] border border-[#E4E4E4] bg-[#F8F8F8] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8a9668]">Modulo</p>
                  <p className="mt-3 font-semibold text-[#0D0D0D]">
                    {humanizeCatalogKey(selectedPermission.moduleKey)}
                  </p>
                </article>
                <article className="rounded-[24px] border border-[#E4E4E4] bg-[#F8F8F8] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8a9668]">Submodulo</p>
                  <p className="mt-3 font-semibold text-[#0D0D0D]">
                    {humanizeCatalogKey(selectedPermission.submoduleKey)}
                  </p>
                </article>
              </div>
            </div>
          )
        ) : null}
      </AdminOverlayPanel>
    </section>
  );
}
