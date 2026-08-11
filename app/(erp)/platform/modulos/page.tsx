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
import { isApiError } from "../../../lib/api";
import {
  createPlatformModule,
  createPlatformSubmodule,
  getPlatformModules,
  updatePlatformModule,
  updatePlatformSubmodule,
} from "../../../lib/platform-admin-api";
import { formatModuleAudience } from "../../../lib/platform-admin-formatters";
import type { PlatformModuleSummary } from "../../../types/platform-admin";

export default function PlatformModulesPage() {
  const { accessToken, isLoading: isAuthLoading, refreshSession, platformContext } =
    useAuth();
  const [modules, setModules] = useState<PlatformModuleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [tableReloadKey, setTableReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<
    "table" | "create-module" | "create-submodule"
  >("table");
  const [selectedModule, setSelectedModule] =
    useState<PlatformModuleSummary | null>(null);
  const [selectedSubmodule, setSelectedSubmodule] = useState<{
    id: string;
    name: string;
    key: string;
    route: string;
    permissionKey: string | null;
    sortOrder: number;
    moduleId: string;
    moduleName: string;
  } | null>(null);
  const [moduleOverlayMode, setModuleOverlayMode] = useState<"detail" | "edit">(
    "detail",
  );
  const [moduleEditForm, setModuleEditForm] = useState<{
    name: string;
    icon: string;
    audience: "PLATFORM" | "ORGANIZATION" | "BOTH";
    sortOrder: string;
  } | null>(null);
  const [submoduleEditForm, setSubmoduleEditForm] = useState<{
    name: string;
    route: string;
    permissionKey: string;
    sortOrder: string;
  } | null>(null);
  const [moduleForm, setModuleForm] = useState({
    key: "",
    name: "",
    icon: "",
    audience: "ORGANIZATION" as "PLATFORM" | "ORGANIZATION" | "BOTH",
    sortOrder: "0",
  });
  const [submoduleForm, setSubmoduleForm] = useState({
    moduleKey: "",
    key: "",
    name: "",
    route: "",
    permissionKey: "",
    sortOrder: "0",
  });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadData() {
    const token = await resolveToken();
    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }
    setModules(await getPlatformModules(token));
  }

  async function fetchModulesTable(input: {
    page: number;
    limit: number;
    search: string;
  }) {
    const token = await resolveToken();
    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const rows = await getPlatformModules(token);

    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (moduleItem, search) =>
        [
          moduleItem.key,
          moduleItem.name,
          moduleItem.icon,
          moduleItem.audience,
          String(moduleItem.sortOrder),
          ...moduleItem.submodules.map((submodule) => submodule.name),
          ...moduleItem.submodules.map((submodule) => submodule.key),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  async function fetchSubmodulesTable(input: {
    page: number;
    limit: number;
    search: string;
  }) {
    const token = await resolveToken();
    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const rows = (await getPlatformModules(token)).flatMap((moduleItem) =>
      moduleItem.submodules.map((submodule) => ({
        moduleId: moduleItem.id,
        moduleName: moduleItem.name,
        audience: moduleItem.audience,
        ...submodule,
      })),
    );

    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (submodule, search) =>
        [
          submodule.key,
          submodule.name,
          submodule.route,
          submodule.permissionKey,
          submodule.moduleName,
          submodule.audience,
          String(submodule.sortOrder),
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
              : "No se pudo cargar el catalogo real de modulos.",
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

  async function handleCreateModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmitMessage(null);
    try {
      const token = await resolveToken();
      if (!token) throw new Error("No se pudo restaurar la sesion del superadmin.");
      await createPlatformModule(token, {
        key: moduleForm.key,
        name: moduleForm.name,
        icon: moduleForm.icon || undefined,
        audience: moduleForm.audience,
        sortOrder: Number(moduleForm.sortOrder || "0"),
      });
      setModuleForm({
        key: "",
        name: "",
        icon: "",
        audience: "ORGANIZATION",
        sortOrder: "0",
      });
      setSubmitMessage("Modulo creado correctamente.");
      setViewMode("table");
      await loadData();
      setTableReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo crear el modulo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateSubmodule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmitMessage(null);
    try {
      const token = await resolveToken();
      if (!token) throw new Error("No se pudo restaurar la sesion del superadmin.");
      await createPlatformSubmodule(token, {
        moduleKey: submoduleForm.moduleKey,
        key: submoduleForm.key,
        name: submoduleForm.name,
        route: submoduleForm.route,
        permissionKey: submoduleForm.permissionKey || undefined,
        sortOrder: Number(submoduleForm.sortOrder || "0"),
      });
      setSubmoduleForm({
        moduleKey: "",
        key: "",
        name: "",
        route: "",
        permissionKey: "",
        sortOrder: "0",
      });
      setSubmitMessage("Submodulo creado correctamente.");
      setViewMode("table");
      await loadData();
      setTableReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo crear el submodulo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedModule || !moduleEditForm) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await resolveToken();
      if (!token) throw new Error("No se pudo restaurar la sesion del superadmin.");
      await updatePlatformModule(token, selectedModule.id, {
        name: moduleEditForm.name,
        icon: moduleEditForm.icon || undefined,
        audience: moduleEditForm.audience,
        sortOrder: Number(moduleEditForm.sortOrder || "0"),
      });
      await loadData();
      setTableReloadKey((current) => current + 1);
      setSelectedModule(null);
      setModuleEditForm(null);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo actualizar el modulo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateSubmodule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSubmodule || !submoduleEditForm) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await resolveToken();
      if (!token) throw new Error("No se pudo restaurar la sesion del superadmin.");
      await updatePlatformSubmodule(token, selectedSubmodule.id, {
        name: submoduleEditForm.name,
        route: submoduleEditForm.route,
        permissionKey: submoduleEditForm.permissionKey || undefined,
        sortOrder: Number(submoduleEditForm.sortOrder || "0"),
      });
      await loadData();
      setTableReloadKey((current) => current + 1);
      setSelectedSubmodule(null);
      setSubmoduleEditForm(null);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo actualizar el submodulo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openModuleDetail(moduleItem: PlatformModuleSummary) {
    setModuleOverlayMode("detail");
    setSelectedModule(moduleItem);
  }

  function openModuleEditor(moduleItem: PlatformModuleSummary) {
    setModuleOverlayMode("edit");
    setSelectedModule(moduleItem);
    setModuleEditForm({
      name: moduleItem.name,
      icon: moduleItem.icon ?? "",
      audience: moduleItem.audience,
      sortOrder: String(moduleItem.sortOrder),
    });
  }

  function openSubmoduleEditor(row: (typeof submoduleRows)[number]) {
    setSelectedSubmodule(row);
    setSubmoduleEditForm({
      name: row.name,
      route: row.route,
      permissionKey: row.permissionKey ?? "",
      sortOrder: String(row.sortOrder),
    });
  }

  const totalSubmodules = modules.reduce(
    (count, moduleItem) => count + moduleItem.submodules.length,
    0,
  );

  const submoduleRows = useMemo(
    () =>
      modules.flatMap((moduleItem) =>
        moduleItem.submodules.map((submodule) => ({
          moduleId: moduleItem.id,
          moduleName: moduleItem.name,
          audience: moduleItem.audience,
          ...submodule,
        })),
      ),
    [modules],
  );

  return (
    <section className="space-y-8">
      <AdminPageHeader
        eyebrow="Superadmin"
        title="Modulos y submodulos"
        description="Aqui defines la estructura alta del sistema. Kapos debe crecer agregando modulos, no rompiendo columnas ni rearmando la base."
        action={
          <div className="flex gap-3">
            {viewMode !== "table" ? (
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
              onClick={() => setViewMode("create-module")}
              icon={<PlusIcon />}
              tone="secondary"
              active={viewMode === "create-module"}
            >
              Crear modulo
            </AdminActionButton>
            <AdminActionButton
              type="button"
              onClick={() => setViewMode("create-submodule")}
              icon={<PlusIcon />}
              tone="secondary"
              active={viewMode === "create-submodule"}
            >
              Crear submodulo
            </AdminActionButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Modulos base"
          value={String(modules.length)}
          hint="Bloques funcionales maestros que ordenan Kapos."
          tone="dark"
        />
        <StatCard
          label="Submodulos"
          value={String(totalSubmodules)}
          hint="Rutas hijas listas para crecer sin tocar la base central."
          tone="accent"
        />
        <StatCard
          label="Modulos platform"
          value={String(modules.filter((m) => m.audience === "PLATFORM").length)}
          hint="Solo visibles para superadmin."
        />
        <StatCard
          label="Modulos organization"
          value={String(
            modules.filter(
              (m) => m.audience === "ORGANIZATION" || m.audience === "BOTH",
            ).length,
          )}
          hint="Bloques ERP activables por cliente."
        />
      </div>

      {error ? (
        <AdminMessage title="No pudimos cargar los modulos" description={error} tone="warn" />
      ) : null}

      <div className="space-y-5">
        {viewMode === "create-module" ? (
          <PanelCard
            title="Crear modulo"
            description="Crea bloques funcionales maestros para plataforma u organizaciones sin tocar la estructura de la base."
          >
            <form className="space-y-4" onSubmit={handleCreateModule}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Key</span>
                  <input
                    required
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm lowercase outline-none transition focus:border-[#a9cf24]"
                    placeholder="rrhh"
                    value={moduleForm.key}
                    onChange={(event) =>
                      setModuleForm((current) => ({
                        ...current,
                        key: event.target.value.toLowerCase(),
                      }))
                    }
                  />
                  <p className="text-xs leading-5 text-[#74805f]">
                    Clave tecnica corta y estable del modulo. Ejemplos: rrhh, ventas, finanzas, configuracion.
                  </p>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Nombre</span>
                  <input
                    required
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    placeholder="Recursos humanos"
                    value={moduleForm.name}
                    onChange={(event) =>
                      setModuleForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Icono</span>
                  <input
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    placeholder="users"
                    value={moduleForm.icon}
                    onChange={(event) =>
                      setModuleForm((current) => ({ ...current, icon: event.target.value }))
                    }
                  />
                  <p className="text-xs leading-5 text-[#74805f]">
                    Campo tecnico opcional para guardar una referencia de icono si luego quieres administrarlo desde base de datos.
                  </p>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Audience</span>
                  <select
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    value={moduleForm.audience}
                    onChange={(event) =>
                      setModuleForm((current) => ({
                        ...current,
                        audience: event.target.value as "PLATFORM" | "ORGANIZATION" | "BOTH",
                      }))
                    }
                  >
                    <option value="ORGANIZATION">Organization</option>
                    <option value="PLATFORM">Platform</option>
                    <option value="BOTH">Both</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Orden</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    value={moduleForm.sortOrder}
                    onChange={(event) =>
                      setModuleForm((current) => ({ ...current, sortOrder: event.target.value }))
                    }
                  />
                  <p className="text-xs leading-5 text-[#74805f]">
                    Menor numero aparece primero en el sidebar. Usa saltos de 10 para poder insertar modulos entre medio.
                  </p>
                </label>
              </div>

              {submitMessage ? (
                <AdminMessage title="Listo" description={submitMessage} tone="accent" />
              ) : null}

              <div className="flex justify-end">
                <AdminActionButton
                  type="submit"
                  disabled={isSubmitting}
                  tone="primary"
                  icon={<PlusIcon />}
                >
                  {isSubmitting ? "Creando..." : "Guardar modulo"}
                </AdminActionButton>
              </div>
            </form>
          </PanelCard>
        ) : viewMode === "create-submodule" ? (
          <PanelCard
            title="Crear submodulo"
            description="Anade rutas hijas a un modulo existente sin rehacer la arquitectura."
          >
            <form className="space-y-4" onSubmit={handleCreateSubmodule}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-[#21300f]">Modulo padre</span>
                  <select
                    required
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    value={submoduleForm.moduleKey}
                    onChange={(event) =>
                      setSubmoduleForm((current) => ({
                        ...current,
                        moduleKey: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecciona un modulo</option>
                    {modules.map((moduleItem) => (
                      <option key={moduleItem.id} value={moduleItem.key}>
                        {moduleItem.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Key</span>
                  <input
                    required
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm lowercase outline-none transition focus:border-[#a9cf24]"
                    placeholder="colaboradores"
                    value={submoduleForm.key}
                    onChange={(event) =>
                      setSubmoduleForm((current) => ({
                        ...current,
                        key: event.target.value.toLowerCase(),
                      }))
                    }
                  />
                  <p className="text-xs leading-5 text-[#74805f]">
                    Clave tecnica del submodulo. Debe ser clara, estable y sin espacios.
                  </p>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Nombre</span>
                  <input
                    required
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    placeholder="Colaboradores"
                    value={submoduleForm.name}
                    onChange={(event) =>
                      setSubmoduleForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-[#21300f]">Route</span>
                  <input
                    required
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    placeholder="/rrhh/colaboradores"
                    value={submoduleForm.route}
                    onChange={(event) =>
                      setSubmoduleForm((current) => ({
                        ...current,
                        route: event.target.value,
                      }))
                    }
                  />
                  <p className="text-xs leading-5 text-[#74805f]">
                    Ruta interna del frontend que abrira esa pantalla dentro del ERP.
                  </p>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Permission key</span>
                  <input
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    placeholder="organization.users.read"
                    value={submoduleForm.permissionKey}
                    onChange={(event) =>
                      setSubmoduleForm((current) => ({
                        ...current,
                        permissionKey: event.target.value,
                      }))
                    }
                  />
                  <p className="text-xs leading-5 text-[#74805f]">
                    Permiso principal asociado al submodulo. Usa formato contexto.recurso.accion.
                  </p>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#21300f]">Orden</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]"
                    value={submoduleForm.sortOrder}
                    onChange={(event) =>
                      setSubmoduleForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                  />
                  <p className="text-xs leading-5 text-[#74805f]">
                    Controla el orden dentro del panel lateral del modulo padre.
                  </p>
                </label>
              </div>

              {submitMessage ? (
                <AdminMessage title="Listo" description={submitMessage} tone="accent" />
              ) : null}

              <div className="flex justify-end">
                <AdminActionButton
                  type="submit"
                  disabled={isSubmitting}
                  tone="primary"
                  icon={<PlusIcon />}
                >
                  {isSubmitting ? "Creando..." : "Guardar submodulo"}
                </AdminActionButton>
              </div>
            </form>
          </PanelCard>
        ) : isLoading ? (
          <AdminMessage
            title="Cargando modulos"
            description="Estamos consultando el catalogo sembrado en la base de Kapos."
          />
        ) : (
          <>
            <PanelCard
              title="Tabla de modulos"
              description="Vista informativa principal con acciones visibles segun permisos."
            >
              <AdminDataTable
                fetchData={fetchModulesTable}
                reloadKey={tableReloadKey}
                rowKey={(row) => row.id}
                permissionKeys={platformContext?.permissionKeys ?? []}
                searchPlaceholder="Buscar por modulo, key, audience o submodulo..."
                emptyTitle="Aun no hay modulos registrados"
                emptyDescription="Crea el primer modulo maestro para que Kapos siga creciendo sin tocar su base."
                columns={[
                  {
                    key: "nombre",
                    label: "Modulo",
                    render: (row) => (
                      <div>
                        <p className="font-semibold text-[#1b2111]">{row.name}</p>
                        <p className="text-xs text-[#7a845f]">{row.key}</p>
                      </div>
                    ),
                  },
                  {
                    key: "audiencia",
                    label: "Audience",
                    render: (row) => (
                      <Tag tone={row.audience === "PLATFORM" ? "dark" : "accent"}>
                        {formatModuleAudience(row.audience)}
                      </Tag>
                    ),
                  },
                  {
                    key: "submodulos",
                    label: "Submodulos",
                    align: "center",
                    render: (row) => row.submodules.length,
                  },
                  {
                    key: "orden",
                    label: "Orden",
                    align: "center",
                    render: (row) => row.sortOrder,
                  },
                ]}
                actions={[
                  {
                    label: "Ver detalle",
                    icon: <EyeIcon />,
                    onClick: (row) => openModuleDetail(row),
                  },
                  {
                    label: "Editar",
                    permission: "platform.modules.update",
                    onClick: (row) => openModuleEditor(row),
                  },
                ]}
              />
            </PanelCard>

            <PanelCard
              title="Tabla de submodulos"
              description="Detalle de rutas hijas organizadas por modulo padre."
            >
              <AdminDataTable
                fetchData={fetchSubmodulesTable}
                reloadKey={tableReloadKey}
                rowKey={(row) => row.id}
                permissionKeys={platformContext?.permissionKeys ?? []}
                searchPlaceholder="Buscar por submodulo, ruta, permiso o modulo..."
                emptyTitle="Aun no hay submodulos registrados"
                emptyDescription="Crea submodulos cuando necesites nuevas rutas o pantallas dentro de un modulo."
                columns={[
                  {
                    key: "submodulo",
                    label: "Submodulo",
                    render: (row) => (
                      <div>
                        <p className="font-semibold text-[#1b2111]">{row.name}</p>
                        <p className="text-xs text-[#7a845f]">{row.key}</p>
                      </div>
                    ),
                  },
                  { key: "modulo", label: "Modulo", render: (row) => row.moduleName },
                  { key: "route", label: "Route", render: (row) => row.route },
                  {
                    key: "permiso",
                    label: "Permission key",
                    render: (row) => row.permissionKey ?? "Sin permiso visible",
                  },
                  {
                    key: "orden",
                    label: "Orden",
                    align: "center",
                    render: (row) => row.sortOrder,
                  },
                ]}
                actions={[
                  {
                    label: "Ver detalle",
                    icon: <EyeIcon />,
                    onClick: (row) => openSubmoduleEditor(row),
                  },
                  {
                    label: "Editar",
                    permission: "platform.modules.update",
                    onClick: (row) => openSubmoduleEditor(row),
                  },
                  {
                    label: "Mover",
                    permission: "platform.modules.update",
                    onClick: (row) => openSubmoduleEditor(row),
                  },
                ]}
              />
            </PanelCard>
          </>
        )}
      </div>

      <AdminOverlayPanel
        open={Boolean(selectedModule)}
        onClose={() => setSelectedModule(null)}
        eyebrow="Modulo maestro"
        title={selectedModule?.name ?? "Detalle de modulo"}
        description="Aqui inspeccionas la pieza base del ERP: para quien existe, que submodulos contiene y si ya esta lista para delegarse."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedModule(null)}>
              Cerrar
            </AdminActionButton>
            {moduleOverlayMode === "edit" ? (
              <AdminActionButton
                tone="primary"
                disabled={isSubmitting}
                onClick={() => {
                  const formElement = document.getElementById("platform-module-edit-form") as HTMLFormElement | null;
                  formElement?.requestSubmit();
                }}
              >
                {isSubmitting ? "Guardando..." : "Guardar modulo"}
              </AdminActionButton>
            ) : (
              <AdminActionButton
                tone="primary"
                onClick={() => selectedModule && openModuleEditor(selectedModule)}
              >
                Editar modulo
              </AdminActionButton>
            )}
          </div>
        }
      >
        {selectedModule ? (
          moduleOverlayMode === "edit" && moduleEditForm ? (
            <form
              id="platform-module-edit-form"
              className="grid gap-4 md:grid-cols-2"
              onSubmit={handleUpdateModule}
            >
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={moduleEditForm.name} onChange={(event) => setModuleEditForm((current) => current ? { ...current, name: event.target.value } : current)} required /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Icono</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={moduleEditForm.icon} onChange={(event) => setModuleEditForm((current) => current ? { ...current, icon: event.target.value } : current)} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Audience</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={moduleEditForm.audience} onChange={(event) => setModuleEditForm((current) => current ? { ...current, audience: event.target.value as typeof moduleEditForm.audience } : current)}><option value="ORGANIZATION">Organization</option><option value="PLATFORM">Platform</option><option value="BOTH">Both</option></select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Orden</span><input type="number" min="0" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={moduleEditForm.sortOrder} onChange={(event) => setModuleEditForm((current) => current ? { ...current, sortOrder: event.target.value } : current)} /><p className="text-xs leading-5 text-[#74805f]">Menor numero aparece primero en el sidebar. Ejemplo: Catalogo 20, Caja 30, Configuracion 90.</p></label>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                <article className="rounded-[28px] border border-[#e7edd5] bg-white/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8ba23f]">
                    Identidad
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[#18200f]">
                    {selectedModule.name}
                  </p>
                  <p className="mt-2 text-sm text-[#61704c]">{selectedModule.key}</p>
                  <div className="mt-4">
                    <Tag tone={selectedModule.audience === "PLATFORM" ? "dark" : "accent"}>
                      {formatModuleAudience(selectedModule.audience)}
                    </Tag>
                  </div>
                </article>

                <article className="rounded-[28px] border border-[#e7edd5] bg-[linear-gradient(135deg,#fcffe9_0%,#f6fadf_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8ba23f]">
                    Submodulos
                  </p>
                  <div className="mt-4 grid gap-3">
                    {selectedModule.submodules.length > 0 ? (
                      selectedModule.submodules.map((submodule) => (
                        <div
                          key={submodule.id}
                          className="rounded-[20px] border border-[#e3ebcd] bg-white/85 px-4 py-3"
                        >
                          <p className="font-semibold text-[#1a210f]">{submodule.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#86925f]">
                            {submodule.route}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#53613d]">Este modulo aun no tiene submodulos.</p>
                    )}
                  </div>
                </article>
              </div>
            </div>
          )
        ) : null}
      </AdminOverlayPanel>

      <AdminOverlayPanel
        open={Boolean(selectedSubmodule)}
        onClose={() => setSelectedSubmodule(null)}
        eyebrow="Submodulo"
        title={selectedSubmodule?.name ?? "Detalle de submodulo"}
        description="Desde aqui puedes corregir la ruta, el permiso principal y el orden de un submodulo concreto."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedSubmodule(null)}>
              Cerrar
            </AdminActionButton>
            <AdminActionButton
              tone="primary"
              disabled={isSubmitting}
              onClick={() => {
                const formElement = document.getElementById("platform-submodule-edit-form") as HTMLFormElement | null;
                formElement?.requestSubmit();
              }}
            >
              {isSubmitting ? "Guardando..." : "Guardar submodulo"}
            </AdminActionButton>
          </div>
        }
      >
        {selectedSubmodule && submoduleEditForm ? (
          <form
            id="platform-submodule-edit-form"
            className="grid gap-4 md:grid-cols-2"
            onSubmit={handleUpdateSubmodule}
          >
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={submoduleEditForm.name} onChange={(event) => setSubmoduleEditForm((current) => current ? { ...current, name: event.target.value } : current)} required /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Orden</span><input type="number" min="0" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={submoduleEditForm.sortOrder} onChange={(event) => setSubmoduleEditForm((current) => current ? { ...current, sortOrder: event.target.value } : current)} /><p className="text-xs leading-5 text-[#74805f]">Menor numero aparece primero dentro de su modulo.</p></label>
            <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#21300f]">Route</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={submoduleEditForm.route} onChange={(event) => setSubmoduleEditForm((current) => current ? { ...current, route: event.target.value } : current)} required /></label>
            <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#21300f]">Permission key</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={submoduleEditForm.permissionKey} onChange={(event) => setSubmoduleEditForm((current) => current ? { ...current, permissionKey: event.target.value } : current)} /></label>
          </form>
        ) : null}
      </AdminOverlayPanel>
    </section>
  );
}
