"use client";

import { useEffect, useState } from "react";
import {
  AdminActionButton,
  ArrowLeftIcon,
  EyeIcon,
  PlusIcon,
} from "../../../components/admin/AdminActionButton";
import {
  AdminMessage,
  AdminPageHeader,
  PanelCard,
  StatCard,
  Tag,
} from "../../../components/admin/AdminBlocks";
import {
  AdminDataTable,
  createLocalAdminTableFetch,
} from "../../../components/admin/AdminDataTable";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import {
  createPlatformOrganization,
  getPlatformModules,
  getPlatformOrganizationUsers,
  getPlatformOrganizations,
  getPlatformUsers,
  updatePlatformOrganization,
} from "../../../lib/platform-admin-api";
import {
  formatModuleAudience,
  formatOrganizationStatus,
} from "../../../lib/platform-admin-formatters";
import type {
  PlatformGlobalUserSummary,
  PlatformModuleSummary,
  PlatformOrganizationUserSummary,
  PlatformOrganizationSummary,
} from "../../../types/platform-admin";
import { isApiError } from "../../../lib/api";

export default function PlatformOrganizationsPage() {
  const { accessToken, isLoading: isAuthLoading, refreshSession, platformContext } =
    useAuth();
  const [organizations, setOrganizations] = useState<PlatformOrganizationSummary[]>([]);
  const [modules, setModules] = useState<PlatformModuleSummary[]>([]);
  const [users, setUsers] = useState<PlatformGlobalUserSummary[]>([]);
  const [organizationUsers, setOrganizationUsers] = useState<
    PlatformOrganizationUserSummary[]
  >([]);
  const [isLoadingOrganizationUsers, setIsLoadingOrganizationUsers] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [tableReloadKey, setTableReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [selectedOrganization, setSelectedOrganization] =
    useState<PlatformOrganizationSummary | null>(null);
  const [overlayMode, setOverlayMode] = useState<"detail" | "edit">("detail");
  const [editForm, setEditForm] = useState<{
    legalName: string;
    tradeName: string;
    slug: string;
    documentNumber: string;
    email: string;
    phone: string;
    status: "ACTIVE" | "TRIAL" | "SUSPENDED" | "DISABLED" | "ARCHIVED";
    ownerUserId: string;
    moduleKeys: string[];
  } | null>(null);
  const [form, setForm] = useState<{
    legalName: string;
    tradeName: string;
    slug: string;
    documentNumber: string;
    email: string;
    phone: string;
    status: "ACTIVE" | "TRIAL" | "SUSPENDED" | "DISABLED" | "ARCHIVED";
    ownerUserId: string;
    moduleKeys: string[];
  }>({
    legalName: "",
    tradeName: "",
    slug: "",
    documentNumber: "",
    email: "",
    phone: "",
    status: "TRIAL" as const,
    ownerUserId: "",
    moduleKeys: [] as string[],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isAuthLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token =
          accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;

        if (!token) {
          throw new Error("No se pudo restaurar la sesion del superadmin.");
        }

        const [organizationsResponse, modulesResponse, usersResponse] = await Promise.all([
          getPlatformOrganizations(token),
          getPlatformModules(token),
          getPlatformUsers(token),
        ]);

        if (cancelled) {
          return;
        }

        setOrganizations(organizationsResponse);
        setModules(modulesResponse);
        setUsers(usersResponse.data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar la cartera real de organizaciones.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthLoading, refreshSession]);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function reloadData() {
    const token = await resolveToken();

    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const [organizationsResponse, modulesResponse, usersResponse] = await Promise.all([
      getPlatformOrganizations(token),
      getPlatformModules(token),
      getPlatformUsers(token),
    ]);

    setOrganizations(organizationsResponse);
    setModules(modulesResponse);
    setUsers(usersResponse.data);
  }

  async function fetchOrganizationsTable(input: {
    page: number;
    limit: number;
    search: string;
  }) {
    const token = await resolveToken();

    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const rows = await getPlatformOrganizations(token);

    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (organization, search) =>
        [
          organization.legalName,
          organization.tradeName,
          organization.slug,
          organization.documentNumber,
          organization.email,
          organization.phone,
          organization.ownerName,
          organization.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  async function loadOrganizationUsers(organizationId: string) {
    setIsLoadingOrganizationUsers(true);

    try {
      const token = await resolveToken();

      if (!token) {
        throw new Error("No se pudo restaurar la sesion del superadmin.");
      }

      const response = await getPlatformOrganizationUsers(token, organizationId, {
        page: 1,
        limit: 8,
      });

      setOrganizationUsers(response.data);
    } catch {
      setOrganizationUsers([]);
    } finally {
      setIsLoadingOrganizationUsers(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    setError(null);

    try {
      const token = await resolveToken();

      if (!token) {
        throw new Error("No se pudo restaurar la sesion del superadmin.");
      }

      await createPlatformOrganization(token, {
        legalName: form.legalName,
        tradeName: form.tradeName || undefined,
        documentNumber: form.documentNumber || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        status: form.status,
        ownerUserId: form.ownerUserId || undefined,
        moduleKeys: form.moduleKeys,
      });

      setForm({
        legalName: "",
        tradeName: "",
        slug: "",
        documentNumber: "",
        email: "",
        phone: "",
        status: "TRIAL",
        ownerUserId: "",
        moduleKeys: [],
      });
      setSubmitMessage("Organizacion creada correctamente.");
      setViewMode("table");
      await reloadData();
      setTableReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo crear la organizacion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedOrganization || !editForm) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setError(null);

    try {
      const token = await resolveToken();

      if (!token) {
        throw new Error("No se pudo restaurar la sesion del superadmin.");
      }

      await updatePlatformOrganization(token, selectedOrganization.id, {
        legalName: editForm.legalName,
        tradeName: editForm.tradeName || undefined,
        documentNumber: editForm.documentNumber || undefined,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        status: editForm.status,
        ownerUserId: editForm.ownerUserId || undefined,
        moduleKeys: editForm.moduleKeys,
      });

      setSubmitMessage("Organizacion actualizada correctamente.");
      await reloadData();
      setTableReloadKey((current) => current + 1);
      setSelectedOrganization(null);
      setEditForm(null);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo actualizar la organizacion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSuspendOrganization(organization: PlatformOrganizationSummary) {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await resolveToken();

      if (!token) {
        throw new Error("No se pudo restaurar la sesion del superadmin.");
      }

      await updatePlatformOrganization(token, organization.id, {
        status: organization.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
      });

      await reloadData();
      setTableReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo cambiar el estado de la organizacion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openOrganizationEditor(organization: PlatformOrganizationSummary) {
    setOverlayMode("edit");
    setSelectedOrganization(organization);
    setEditForm({
      legalName: organization.legalName,
      tradeName: organization.tradeName ?? "",
      slug: organization.slug,
      documentNumber: organization.documentNumber ?? "",
      email: organization.email ?? "",
      phone: organization.phone ?? "",
      status: organization.status,
      ownerUserId: organization.ownerUserId ?? "",
      moduleKeys: organization.moduleKeys,
    });
  }

  function toggleModule(moduleKey: string) {
    setForm((current) => ({
      ...current,
      moduleKeys: current.moduleKeys.includes(moduleKey)
        ? current.moduleKeys.filter((key) => key !== moduleKey)
        : [...current.moduleKeys, moduleKey],
    }));
  }

  const activeOrganizations = organizations.filter(
    (organization) => organization.status === "ACTIVE",
  ).length;
  const trialOrganizations = organizations.filter(
    (organization) => organization.status === "TRIAL",
  ).length;
  const organizationModules = modules.filter(
    (moduleItem) => moduleItem.audience === "ORGANIZATION" || moduleItem.audience === "BOTH",
  );

  return (
    <section className="space-y-8">
      <AdminPageHeader
        eyebrow="Superadmin"
        title="Organizaciones y clientes"
        description="Aqui nacen empresas como Basti, defines su owner inicial y eliges que modulos base podran usar antes de entrar a Kapos."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? (
              <AdminActionButton
                onClick={() => setViewMode("table")}
                icon={<ArrowLeftIcon />}
                tone="ghost"
              >
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton
              onClick={() => setViewMode("create")}
              icon={<PlusIcon />}
              tone="primary"
              active={viewMode === "create"}
            >
              Crear organizacion
            </AdminActionButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Empresas activas"
          value={String(activeOrganizations)}
          hint="Clientes que ya tienen estructura viva dentro del ERP."
          tone="dark"
        />
        <StatCard
          label="Empresas en prueba"
          value={String(trialOrganizations)}
          hint="Organizaciones aun en fase inicial o de implementacion."
          tone="accent"
        />
        <StatCard
          label="Modulos organization"
          value={String(organizationModules.length)}
          hint="Catalogo ERP listo para encenderse por cliente."
        />
      </div>

      {error ? (
        <AdminMessage
          title="No pudimos cargar las organizaciones"
          description={error}
          tone="warn"
        />
      ) : null}

      <PanelCard
          title={viewMode === "create" ? "Crear organizacion" : "Cartera real"}
          description={
            viewMode === "create"
              ? "Alta funcional para nuevos clientes. Aqui naces la empresa, asignas owner si ya existe y dejas prendidos los modulos base."
              : "Base actual obtenida desde la base de datos de Kapos."
          }
      >
          {viewMode === "create" ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Razon social</span>
                  <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder="Basti Foods S.A.C." value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Nombre comercial</span>
                  <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder="Basti" value={form.tradeName} onChange={(event) => setForm((current) => ({ ...current, tradeName: event.target.value }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">RUC o documento</span>
                  <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder="20601234567" value={form.documentNumber} onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Correo</span>
                  <input type="email" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder="contacto@basti.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Telefono</span>
                  <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder="+51 999 888 777" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Estado inicial</span>
                  <select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "ACTIVE" | "TRIAL" | "SUSPENDED" | "DISABLED" | "ARCHIVED" }))}>
                    <option value="TRIAL">Prueba</option>
                    <option value="ACTIVE">Activa</option>
                    <option value="SUSPENDED">Suspendida</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Owner inicial</span>
                  <select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.ownerUserId} onChange={(event) => setForm((current) => ({ ...current, ownerUserId: event.target.value }))}>
                    <option value="">Sin owner por ahora</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {(user.name ?? user.email ?? user.identifier ?? "Usuario")} · {user.email ?? "sin correo"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs leading-5 text-[#74805f]">
                    El owner es la persona responsable inicial de esa empresa dentro de Kapos. Luego podra entrar y terminar de configurarla.
                  </p>
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#21300f]">Modulos base</p>
                <div className="flex flex-wrap gap-2">
                  {organizationModules.map((moduleItem) => {
                    const active = form.moduleKeys.includes(moduleItem.key);
                    return (
                      <AdminActionButton
                        key={moduleItem.id}
                        onClick={() => toggleModule(moduleItem.key)}
                        tone="secondary"
                        active={active}
                        size="sm"
                      >
                        {moduleItem.name}
                      </AdminActionButton>
                    );
                  })}
                </div>
              </div>

              {submitMessage ? <AdminMessage title="Listo" description={submitMessage} tone="accent" /> : null}

              <div className="flex justify-end">
                <AdminActionButton type="submit" disabled={isSubmitting} tone="primary" icon={<PlusIcon />}>
                  {isSubmitting ? "Creando..." : "Guardar organizacion"}
                </AdminActionButton>
              </div>
            </form>
          ) : isLoading ? (
            <AdminMessage title="Cargando organizaciones" description="Estamos trayendo la cartera real de clientes para el panel de superadmin." tone="soft" />
          ) : (
            <AdminDataTable
              fetchData={fetchOrganizationsTable}
              reloadKey={tableReloadKey}
              rowKey={(row) => row.id}
              permissionKeys={platformContext?.permissionKeys ?? []}
              searchPlaceholder="Buscar por empresa, slug, owner, documento..."
              emptyTitle="Aun no hay organizaciones registradas"
              emptyDescription="El siguiente paso natural es crear tu primer cliente real desde Kapos, asignarle owner y luego encenderle modulos."
              columns={[
                {
                  key: "empresa",
                  label: "Empresa",
                  render: (organization) => (
                    <div>
                      <p className="font-semibold text-[#1b2111]">
                        {organization.tradeName ?? organization.legalName}
                      </p>
                      <p className="text-xs text-[#7a845f]">/{organization.slug}</p>
                    </div>
                  ),
                },
                {
                  key: "owner",
                  label: "Owner",
                  render: (organization) => organization.ownerName ?? "Sin owner",
                },
                {
                  key: "documento",
                  label: "Documento",
                  render: (organization) => organization.documentNumber ?? "Sin documento",
                },
                {
                  key: "modulos",
                  label: "Modulos",
                  align: "center",
                  render: (organization) => organization.activeModules,
                },
                {
                  key: "colaboradores",
                  label: "Colaboradores",
                  align: "center",
                  render: (organization) => organization.activeWorkers,
                },
                {
                  key: "estado",
                  label: "Estado",
                  render: (organization) => (
                    <Tag
                      tone={
                        organization.status === "ACTIVE"
                          ? "accent"
                          : organization.status === "TRIAL"
                            ? "warn"
                            : "dark"
                      }
                    >
                      {formatOrganizationStatus(organization.status)}
                    </Tag>
                  ),
                },
              ]}
              actions={[
                {
                  label: "Ver detalle",
                  icon: <EyeIcon />,
                  onClick: (organization) => {
                    setOverlayMode("detail");
                    setSelectedOrganization(organization);
                    void loadOrganizationUsers(organization.id);
                  },
                },
                {
                  label: "Editar",
                  permission: "platform.organizations.update",
                  onClick: (organization) => openOrganizationEditor(organization),
                },
                {
                  label: "Suspender",
                  permission: "platform.organizations.update",
                  tone: "warn",
                  onClick: (organization) => void handleSuspendOrganization(organization),
                },
              ]}
            />
          )}
        </PanelCard>

        <div className="hidden">
          <ol className="space-y-2 text-sm leading-6 text-[#46523a]">
            {[
              "Crear organizacion y slug unico.",
              "Crear o vincular owner.",
              "Encender modulos organization.",
              "El owner configura sucursales y personal.",
            ].map((step, index) => (
              <li
                key={step}
                className="flex gap-3 rounded-[18px] border border-[#edf1e4] bg-[#fafcf6] px-3 py-2"
              >
                <span className="font-semibold text-[#91aa47]">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {!isLoading && organizationModules.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {organizationModules.slice(0, 6).map((moduleItem) => (
                <Tag key={moduleItem.id} tone="soft">
                  {moduleItem.name} · {formatModuleAudience(moduleItem.audience)}
                </Tag>
              ))}
            </div>
          ) : null}
        </div>

      <AdminOverlayPanel
        open={Boolean(selectedOrganization)}
        onClose={() => {
          setSelectedOrganization(null);
          setOrganizationUsers([]);
        }}
        eyebrow="Organizacion"
        title={
          selectedOrganization?.tradeName ??
          selectedOrganization?.legalName ??
          "Detalle de organizacion"
        }
        description="Panel rapido para revisar la salud de un cliente y decidir si debes editarlo, suspenderlo o continuar con su configuracion."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton
              tone="ghost"
              onClick={() => {
                setSelectedOrganization(null);
                setOrganizationUsers([]);
              }}
            >
              Cerrar
            </AdminActionButton>
            {overlayMode === "edit" ? (
              <AdminActionButton
                tone="primary"
                disabled={isSubmitting}
                onClick={() => {
                  const form = document.getElementById(
                    "organization-edit-form",
                  ) as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </AdminActionButton>
            ) : (
              <AdminActionButton
                tone="primary"
                onClick={() =>
                  selectedOrganization && openOrganizationEditor(selectedOrganization)
                }
              >
                Editar estructura
              </AdminActionButton>
            )}
          </div>
        }
      >
        {selectedOrganization ? (
          overlayMode === "edit" && editForm ? (
            <form
              id="organization-edit-form"
              className="space-y-4"
              onSubmit={handleUpdateOrganization}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Razon social</span>
                  <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.legalName} onChange={(event) => setEditForm((current) => current ? { ...current, legalName: event.target.value } : current)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Nombre comercial</span>
                  <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.tradeName} onChange={(event) => setEditForm((current) => current ? { ...current, tradeName: event.target.value } : current)} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Documento</span>
                  <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.documentNumber} onChange={(event) => setEditForm((current) => current ? { ...current, documentNumber: event.target.value } : current)} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Correo</span>
                  <input type="email" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.email} onChange={(event) => setEditForm((current) => current ? { ...current, email: event.target.value } : current)} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Telefono</span>
                  <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.phone} onChange={(event) => setEditForm((current) => current ? { ...current, phone: event.target.value } : current)} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Estado</span>
                  <select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.status} onChange={(event) => setEditForm((current) => current ? { ...current, status: event.target.value as typeof editForm.status } : current)}>
                    <option value="TRIAL">Prueba</option>
                    <option value="ACTIVE">Activa</option>
                    <option value="SUSPENDED">Suspendida</option>
                    <option value="DISABLED">Deshabilitada</option>
                    <option value="ARCHIVED">Archivada</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Owner</span>
                  <select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.ownerUserId} onChange={(event) => setEditForm((current) => current ? { ...current, ownerUserId: event.target.value } : current)}>
                    <option value="">Sin cambio</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name ?? user.email ?? user.identifier ?? "Usuario"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#21300f]">Modulos activos</p>
                <div className="flex flex-wrap gap-2">
                  {organizationModules.map((moduleItem) => {
                    const active = editForm.moduleKeys.includes(moduleItem.key);
                    return (
                      <AdminActionButton
                        key={moduleItem.id}
                        onClick={() =>
                          setEditForm((current) =>
                            current
                              ? {
                                  ...current,
                                  moduleKeys: current.moduleKeys.includes(moduleItem.key)
                                    ? current.moduleKeys.filter((key) => key !== moduleItem.key)
                                    : [...current.moduleKeys, moduleItem.key],
                                }
                              : current,
                          )
                        }
                        tone="secondary"
                        active={active}
                        size="sm"
                      >
                        {moduleItem.name}
                      </AdminActionButton>
                    );
                  })}
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[28px] border border-[#e7edd5] bg-white/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8ba23f]">
                    Identidad
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[#18200f]">
                    {selectedOrganization.tradeName ?? selectedOrganization.legalName}
                  </p>
                  <p className="mt-2 text-sm text-[#61704c]">
                    {selectedOrganization.legalName}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#889368]">
                    /{selectedOrganization.slug}
                  </p>
                </article>

                <article className="rounded-[28px] border border-[#e7edd5] bg-[linear-gradient(135deg,#fcffe9_0%,#f6fadf_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8ba23f]">
                    Estado actual
                  </p>
                  <div className="mt-4">
                    <Tag
                      tone={
                        selectedOrganization.status === "ACTIVE"
                          ? "accent"
                          : selectedOrganization.status === "TRIAL"
                            ? "warn"
                            : "dark"
                      }
                    >
                      {formatOrganizationStatus(selectedOrganization.status)}
                    </Tag>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#53613d]">
                    Owner: {selectedOrganization.ownerName ?? "Sin owner asignado"}
                  </p>
                </article>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-[24px] border border-[#edf1e4] bg-[#fbfcf8] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8a9668]">Documento</p>
                  <p className="mt-3 font-semibold text-[#1b2111]">
                    {selectedOrganization.documentNumber ?? "Sin documento"}
                  </p>
                </article>
                <article className="rounded-[24px] border border-[#edf1e4] bg-[#fbfcf8] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8a9668]">Modulos</p>
                  <p className="mt-3 font-semibold text-[#1b2111]">
                    {selectedOrganization.activeModules}
                  </p>
                </article>
                <article className="rounded-[24px] border border-[#edf1e4] bg-[#fbfcf8] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8a9668]">Colaboradores</p>
                  <p className="mt-3 font-semibold text-[#1b2111]">
                    {selectedOrganization.activeWorkers}
                  </p>
                </article>
              </div>

              <article className="rounded-[28px] border border-[#e7edd5] bg-white/90 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8ba23f]">
                      Usuarios internos
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#61704c]">
                      Personas vinculadas a esta empresa. No se mezclan con los
                      usuarios globales de Kapos.
                    </p>
                  </div>
                  <Tag tone="soft">{organizationUsers.length} visibles</Tag>
                </div>

                <div className="mt-4 space-y-3">
                  {isLoadingOrganizationUsers ? (
                    <p className="rounded-[22px] border border-[#edf1e4] bg-[#fbfcf8] px-4 py-4 text-sm text-[#61704c]">
                      Cargando usuarios de esta organizacion...
                    </p>
                  ) : organizationUsers.length > 0 ? (
                    organizationUsers.map((membership) => (
                      <div
                        key={membership.id}
                        className="grid gap-3 rounded-[22px] border border-[#edf1e4] bg-[#fbfcf8] px-4 py-4 md:grid-cols-[1fr_auto]"
                      >
                        <div>
                          <p className="font-semibold text-[#1b2111]">
                            {[
                              membership.user.firstName,
                              membership.user.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") ||
                              membership.user.email ||
                              membership.user.documentNumber ||
                              "Usuario sin nombre"}
                          </p>
                          <p className="mt-1 text-xs text-[#7a845f]">
                            {membership.user.email ?? "Sin correo"} -{" "}
                            {membership.employeeCode ?? "Sin codigo interno"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          <Tag
                            tone={
                              membership.status === "ACTIVE" ? "accent" : "dark"
                            }
                          >
                            {membership.status}
                          </Tag>
                          {membership.roleNames.slice(0, 3).map((roleName) => (
                            <Tag key={roleName} tone="soft">
                              {roleName}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-[22px] border border-[#edf1e4] bg-[#fbfcf8] px-4 py-4 text-sm text-[#61704c]">
                      Esta organizacion aun no tiene usuarios internos vinculados.
                    </p>
                  )}
                </div>
              </article>
            </div>
          )
        ) : null}
      </AdminOverlayPanel>
    </section>
  );
}
