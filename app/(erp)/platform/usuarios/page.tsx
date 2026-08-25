"use client";

import { useEffect, useState } from "react";
import {
  AdminActionButton,
  ArrowLeftIcon,
  EyeIcon,
  PlusIcon,
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
} from "../../../components/admin/AdminPermissionMatrix";
import { useAuth } from "../../../context/auth-context";
import { isApiError } from "../../../lib/api";
import {
  assignPlatformMembership,
  createPlatformUser,
  getOrganizationRoles,
  getPlatformModules,
  getPlatformOrganizations,
  getPlatformPermissions,
  getPlatformRoles,
  getPlatformUsers,
  unlinkPlatformMembership,
  updateMembershipPermissionOverrides,
  updatePlatformPermissionOverrides,
  updatePlatformUser,
} from "../../../lib/platform-admin-api";
import {
  formatGlobalUserScope,
  formatUserStatus,
} from "../../../lib/platform-admin-formatters";
import type {
  PlatformGlobalUserSummary,
  PlatformMembershipSummary,
  PlatformModuleSummary,
  PlatformOrganizationSummary,
  PlatformPermissionSummary,
  PlatformRoleTemplate,
} from "../../../types/platform-admin";

type PermissionOverrideDraft = {
  allowPermissionKeys: string[];
  denyPermissionKeys: string[];
};

export default function PlatformUsersPage() {
  const {
    accessToken,
    isLoading: isAuthLoading,
    refreshSession,
    platformContext,
    reloadCurrentUser,
    user: currentUser,
  } = useAuth();
  const [users, setUsers] = useState<PlatformGlobalUserSummary[]>([]);
  const [roles, setRoles] = useState<PlatformRoleTemplate[]>([]);
  const [membershipRoleOptions, setMembershipRoleOptions] = useState<
    PlatformRoleTemplate[]
  >([]);
  const [permissions, setPermissions] = useState<PlatformPermissionSummary[]>([]);
  const [modules, setModules] = useState<PlatformModuleSummary[]>([]);
  const [organizations, setOrganizations] = useState<PlatformOrganizationSummary[]>([]);
  const [tableReloadKey, setTableReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [selectedUser, setSelectedUser] =
    useState<PlatformGlobalUserSummary | null>(null);
  const [overlayMode, setOverlayMode] = useState<"detail" | "edit" | "assign">(
    "detail",
  );
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    documentType: "DNI" as "DNI" | "RUC" | "CE" | "PASSPORT",
    documentNumber: "",
    phone: "",
    status: "ACTIVE" as "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED",
    organizationId: "",
    organizationRoleScopeKey: "",
    platformRoleScopeKey: "",
  });
  const [editForm, setEditForm] = useState<{
    email: string;
    firstName: string;
    lastName: string;
  documentType: "DNI" | "RUC" | "CE" | "PASSPORT";
    documentNumber: string;
    phone: string;
    status: "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED";
    platformRoleScopeKey: string;
    platformOverrides: PermissionOverrideDraft;
    membershipOverrides: Record<string, PermissionOverrideDraft>;
  } | null>(null);
  const [membershipForm, setMembershipForm] = useState<{
    organizationId: string;
    roleScopeKey: string;
    status: "INVITED" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TERMINATED";
    title: string;
    employeeCode: string;
  } | null>(null);

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
      organizationsResponse,
      permissionsResponse,
      modulesResponse,
    ] = await Promise.all([
      getPlatformRoles(token),
      getPlatformOrganizations(token),
      getPlatformPermissions(token),
      getPlatformModules(token),
    ]);

    setRoles(rolesResponse);
    setOrganizations(organizationsResponse);
    setPermissions(permissionsResponse);
    setModules(modulesResponse);
    setMembershipRoleOptions(
      rolesResponse.filter((role) => role.context === "ORGANIZATION"),
    );
  }

  async function loadMembershipRoleOptions(organizationId: string) {
    const baseOrganizationRoles = roles.filter(
      (role) => role.context === "ORGANIZATION",
    );

    if (!organizationId) {
      setMembershipRoleOptions(baseOrganizationRoles);
      return;
    }

    const token = await resolveToken();

    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const organizationRolesResponse = await getOrganizationRoles(
      token,
      organizationId,
    );
    setMembershipRoleOptions(organizationRolesResponse);
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
              : "No se pudo cargar el directorio global de usuarios.",
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

  async function fetchUsers(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();

    if (!token) {
      throw new Error("No se pudo restaurar la sesion del superadmin.");
    }

    const response = await getPlatformUsers(token, input);

    return {
      data: response.data,
      total: response.total,
    };
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

      await createPlatformUser(token, {
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        documentType: form.documentNumber ? form.documentType : undefined,
        documentNumber: form.documentNumber || undefined,
        phone: form.phone || undefined,
        status: form.status,
        organizationId: form.organizationId || undefined,
        organizationRoleScopeKey: form.organizationRoleScopeKey || undefined,
        platformRoleScopeKey: form.platformRoleScopeKey || undefined,
      });

      setForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        documentType: "DNI",
        documentNumber: "",
        phone: "",
        status: "ACTIVE",
        organizationId: "",
        organizationRoleScopeKey: "",
        platformRoleScopeKey: "",
      });
      setSubmitMessage("Usuario global creado correctamente.");
      setViewMode("table");
      await loadData();
      setTableReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo crear el usuario global.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser || !editForm) {
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

      await updatePlatformUser(token, selectedUser.id, {
        email: editForm.email,
        firstName: editForm.firstName || undefined,
        lastName: editForm.lastName || undefined,
        documentType: editForm.documentNumber ? editForm.documentType : undefined,
        documentNumber: editForm.documentNumber || undefined,
        phone: editForm.phone || undefined,
        status: editForm.status,
        platformRoleScopeKey: editForm.platformRoleScopeKey || undefined,
      });

      if (editForm.platformRoleScopeKey) {
        await updatePlatformPermissionOverrides(token, selectedUser.id, {
          allowPermissionKeys: editForm.platformOverrides.allowPermissionKeys,
          denyPermissionKeys: editForm.platformOverrides.denyPermissionKeys,
        });
      }

      await Promise.all(
        selectedUser.memberships.map((membership) => {
          const overrides = editForm.membershipOverrides[membership.id];

          if (!overrides) {
            return Promise.resolve();
          }

          return updateMembershipPermissionOverrides(
            token,
            selectedUser.id,
            membership.id,
            {
              allowPermissionKeys: overrides.allowPermissionKeys,
              denyPermissionKeys: overrides.denyPermissionKeys,
            },
          );
        }),
      );

      setSubmitMessage("Usuario actualizado correctamente.");
      await loadData();
      if (selectedUser.id === currentUser?.id) {
        await reloadCurrentUser();
      }
      setTableReloadKey((current) => current + 1);
      setSelectedUser(null);
      setEditForm(null);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo actualizar el usuario global.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignMembership(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser || !membershipForm) {
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

      await assignPlatformMembership(token, selectedUser.id, {
        organizationId: membershipForm.organizationId,
        roleScopeKey: membershipForm.roleScopeKey || undefined,
        roleScopeKeys: membershipForm.roleScopeKey
          ? [membershipForm.roleScopeKey]
          : [],
        replaceRoles: true,
        status: membershipForm.status,
        title: membershipForm.title || undefined,
        employeeCode: membershipForm.employeeCode || undefined,
      });

      setSubmitMessage("Membership asignada correctamente.");
      await loadData();
      setTableReloadKey((current) => current + 1);
      setSelectedUser(null);
      setMembershipForm(null);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo asignar la membership.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openUserDetail(user: PlatformGlobalUserSummary) {
    setOverlayMode("detail");
    setSelectedUser(user);
  }

  function openUserEditor(user: PlatformGlobalUserSummary) {
    setOverlayMode("edit");
    setSelectedUser(user);
    setEditForm({
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      documentType: user.documentType ?? "DNI",
      documentNumber: user.identifier ?? "",
      phone: user.phone ?? "",
      status: user.status,
      platformRoleScopeKey: user.platformRoleScopeKeys[0] ?? "",
      platformOverrides: {
        allowPermissionKeys: user.platformAllowPermissionKeys,
        denyPermissionKeys: user.platformDenyPermissionKeys,
      },
      membershipOverrides: Object.fromEntries(
        user.memberships.map((membership) => [
          membership.id,
          {
            allowPermissionKeys: membership.allowPermissionKeys,
            denyPermissionKeys: membership.denyPermissionKeys,
          },
        ]),
      ),
    });
  }

  function openMembershipAssigner(user: PlatformGlobalUserSummary) {
    setOverlayMode("assign");
    setSelectedUser(user);
    void loadMembershipRoleOptions(user.memberships[0]?.organizationId ?? "");
    setMembershipForm({
      organizationId: user.memberships[0]?.organizationId ?? "",
      roleScopeKey: user.memberships[0]?.roleScopeKeys[0] ?? "",
      status: "ACTIVE",
      title: "",
      employeeCode: "",
    });
  }

  function getEffectivePermissionKeys(
    basePermissionKeys: string[],
    overrides: PermissionOverrideDraft,
  ) {
    const permissionKeys = new Set(basePermissionKeys);

    for (const permissionKey of overrides.allowPermissionKeys) {
      permissionKeys.add(permissionKey);
    }

    for (const permissionKey of overrides.denyPermissionKeys) {
      permissionKeys.delete(permissionKey);
    }

    return Array.from(permissionKeys);
  }

  function toggleOverride(
    basePermissionKeys: string[],
    overrides: PermissionOverrideDraft,
    permissionKey: string,
  ): PermissionOverrideDraft {
    const active = getEffectivePermissionKeys(basePermissionKeys, overrides).includes(
      permissionKey,
    );

    if (active) {
      return {
        allowPermissionKeys: overrides.allowPermissionKeys.filter(
          (key) => key !== permissionKey,
        ),
        denyPermissionKeys: Array.from(
          new Set([...overrides.denyPermissionKeys, permissionKey]),
        ),
      };
    }

    return {
      allowPermissionKeys: Array.from(
        new Set([...overrides.allowPermissionKeys, permissionKey]),
      ),
      denyPermissionKeys: overrides.denyPermissionKeys.filter(
        (key) => key !== permissionKey,
      ),
    };
  }

  async function handleUnlinkMembership(membershipId: string) {
    if (!selectedUser) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await resolveToken();

      if (!token) {
        throw new Error("No se pudo restaurar la sesion del superadmin.");
      }

      await unlinkPlatformMembership(token, selectedUser.id, membershipId);
      await loadData();
      if (selectedUser.id === currentUser?.id) {
        await reloadCurrentUser();
      }
      setTableReloadKey((current) => current + 1);
      setSelectedUser(null);
      setEditForm(null);
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.messages.join(" ")
          : submitError instanceof Error
            ? submitError.message
            : "No se pudo desvincular al usuario de la organizacion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const platformRoles = roles.filter((role) => role.context === "PLATFORM");
  const organizationRoles = roles.filter((role) => role.context === "ORGANIZATION");
  const platformPermissions = permissions.filter(
    (permission) => permission.audience === "PLATFORM",
  );
  const organizationPermissions = permissions.filter(
    (permission) => permission.audience !== "PLATFORM",
  );
  const organizationPermissionRows = buildPermissionMatrixRows(
    modules,
    organizationPermissions,
  );
  const owners = users.filter((user) => user.scope === "OWNER").length;

  function renderMembershipPermissionMatrix(
    membership: PlatformMembershipSummary,
    membershipOverrides: PermissionOverrideDraft,
    effectiveMembershipPermissions: string[],
  ) {
    const enabledModuleKeys = new Set(membership.organizationModuleKeys);
    const membershipPermissionRows = organizationPermissionRows.filter(
      (row) => row.moduleKey === "system" || enabledModuleKeys.has(row.moduleKey),
    );

    return (
      <AdminPermissionMatrix
        rows={membershipPermissionRows}
        selectedPermissionKeys={effectiveMembershipPermissions}
        emptyTitle="Sin permisos disponibles para esta organizacion"
        emptyDescription="Primero habilita modulos para esta organizacion desde Superadmin > Organizaciones. Luego podras delegar sus permisos aqui."
        className="h-full"
        onToggle={(permissionKey) =>
          setEditForm((current) =>
            current
              ? {
                  ...current,
                  membershipOverrides: {
                    ...current.membershipOverrides,
                    [membership.id]: toggleOverride(
                      membership.rolePermissionKeys,
                      membershipOverrides,
                      permissionKey,
                    ),
                  },
                }
              : current,
          )
        }
      />
    );
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Superadmin"
        title="Usuarios globales y owners"
        description="Desde aqui controlas la identidad compartida de Kapos: quien existe, a que empresa entra y si actua como platform admin, owner o manager."
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
              tone="accent"
              active={viewMode === "create"}
            >
              Crear usuario global
            </AdminActionButton>
          </div>
        }
        stats={[
          { label: "Usuarios globales", value: String(users.length), hint: "Identidades unicas reutilizables entre clientes y ERP." },
          { label: "Owners activos", value: String(owners), hint: "Responsables que podran gobernar sus organizaciones.", tone: "accent" },
          { label: "Roles base", value: String(roles.length), hint: "Roles disponibles para asignar accesos.", tone: "dark" },
        ]}
      />

      {error ? <AdminMessage title="No pudimos cargar los usuarios globales" description={error} tone="warn" /> : null}

      <div className="space-y-5">
        <PanelCard
          title={viewMode === "create" ? "Crear usuario global" : "Identidades maestras"}
          description={
            viewMode === "create"
              ? "Alta real de identidad compartida. Desde aqui puedes dejarlo como platform admin o asignarlo de una vez a una organizacion."
              : "Aqui viven las personas unicas del ecosistema Kapos, no usuarios duplicados por empresa."
          }
        >
          {viewMode === "create" ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Correo</span><input type="email" required className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Contrasena</span><input type="password" required className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nombres</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Apellidos</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Tipo documento</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.documentType} onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value as "DNI" | "RUC" | "CE" | "PASSPORT" }))}><option value="DNI">DNI</option><option value="RUC">RUC</option><option value="CE">CE</option><option value="PASSPORT">Pasaporte</option></select></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Numero documento</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.documentNumber} onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Telefono</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Estado</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED" }))}><option value="ACTIVE">Activo</option><option value="INVITED">Invitado</option><option value="SUSPENDED">Suspendido</option></select></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#0D0D0D]">Rol de plataforma</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.platformRoleScopeKey} onChange={(event) => setForm((current) => ({ ...current, platformRoleScopeKey: event.target.value }))}><option value="">Sin acceso de plataforma</option>{platformRoles.map((role) => (<option key={role.id} value={role.scopeKey}>{role.name}</option>))}</select></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Organizacion</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.organizationId} onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))}><option value="">Sin asignacion inicial</option>{organizations.map((organization) => (<option key={organization.id} value={organization.id}>{organization.tradeName ?? organization.legalName}</option>))}</select></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Rol en organizacion</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.organizationRoleScopeKey} onChange={(event) => setForm((current) => ({ ...current, organizationRoleScopeKey: event.target.value }))}><option value="">Sin rol inicial</option>{organizationRoles.map((role) => (<option key={role.id} value={role.scopeKey}>{role.name}</option>))}</select></label>
              </div>
              {submitMessage ? <AdminMessage title="Listo" description={submitMessage} tone="accent" /> : null}
              <div className="flex justify-end"><AdminActionButton type="submit" disabled={isSubmitting} tone="primary" icon={<PlusIcon />}>{isSubmitting ? "Creando..." : "Guardar usuario global"}</AdminActionButton></div>
            </form>
          ) : isLoading ? (
            <AdminMessage title="Cargando usuarios globales" description="Estamos consultando identidades y memberships reales desde la base de datos." />
          ) : (
            <AdminDataTable
              fetchData={fetchUsers}
              onDataLoaded={(result) => setUsers(result.data)}
              reloadKey={tableReloadKey}
              initialLimit={10}
              rowKey={(row) => row.id}
              permissionKeys={platformContext?.permissionKeys ?? []}
              searchPlaceholder="Buscar por nombre, correo, DNI u organizacion..."
              emptyTitle="Aun no hay usuarios globales vinculados"
              emptyDescription="Por ahora deberias ver al superadmin inicial. Los siguientes usuarios naceran cuando crees owners o vincules personas a organizaciones."
              columns={[
                {
                  key: "identidad",
                  label: "Identidad",
                  render: (user) => (
                    <div>
                      <p className="font-semibold text-[#0D0D0D]">{user.name ?? "Sin nombre"}</p>
                      <p className="text-sm text-[#677254]">{[user.email, user.identifier].filter(Boolean).join(" · ") || "Sin identificador"}</p>
                    </div>
                  ),
                },
                {
                  key: "empresas",
                  label: "Organizaciones",
                  render: (user) => user.organizations.length > 0 ? user.organizations.map((organization) => organization.name).join(", ") : "Sin relacion",
                },
                {
                  key: "scope",
                  label: "Scope",
                  render: (user) => <Tag tone={user.scope === "PLATFORM" ? "dark" : "soft"}>{formatGlobalUserScope(user.scope)}</Tag>,
                },
                {
                  key: "estado",
                  label: "Estado",
                  render: (user) => <Tag tone={user.status === "ACTIVE" ? "accent" : user.status === "INVITED" ? "warn" : "dark"}>{formatUserStatus(user.status)}</Tag>,
                },
              ]}
              actions={[
                { label: "Ver detalle", icon: <EyeIcon />, onClick: (user) => openUserDetail(user) },
                { label: "Editar", permission: "platform.users.update", onClick: (user) => openUserEditor(user) },
                { label: "Asignar", permission: "platform.memberships.update", tone: "accent", onClick: (user) => openMembershipAssigner(user) },
              ]}
            />
          )}
        </PanelCard>

      </div>

      <AdminOverlayPanel
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        eyebrow="Usuario global"
        title={selectedUser?.name ?? selectedUser?.email ?? "Detalle de usuario"}
        description="Aqui revisas una identidad maestra: donde participa, que alcance tiene y si ya esta lista para convertirse en owner o colaborador."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedUser(null)}>
              Cerrar
            </AdminActionButton>
            {overlayMode === "edit" ? (
              <AdminActionButton
                tone="primary"
                disabled={isSubmitting}
                onClick={() => {
                  const formElement = document.getElementById("platform-user-edit-form") as HTMLFormElement | null;
                  formElement?.requestSubmit();
                }}
              >
                {isSubmitting ? "Guardando..." : "Guardar usuario"}
              </AdminActionButton>
            ) : overlayMode === "assign" ? (
              <AdminActionButton
                tone="accent"
                disabled={isSubmitting}
                onClick={() => {
                  const formElement = document.getElementById("platform-membership-form") as HTMLFormElement | null;
                  formElement?.requestSubmit();
                }}
              >
                {isSubmitting ? "Guardando..." : "Guardar acceso"}
              </AdminActionButton>
            ) : (
              <>
                {platformContext?.permissionKeys.includes("platform.users.update") ? (
                  <AdminActionButton
                    tone="primary"
                    onClick={() => selectedUser && openUserEditor(selectedUser)}
                  >
                    Editar usuario
                  </AdminActionButton>
                ) : null}
                {platformContext?.permissionKeys.includes("platform.memberships.update") ? (
                  <AdminActionButton
                    tone="accent"
                    onClick={() => selectedUser && openMembershipAssigner(selectedUser)}
                  >
                    Editar acceso
                  </AdminActionButton>
                ) : null}
              </>
            )}
          </div>
        }
      >
        {selectedUser ? (
          overlayMode === "edit" && editForm ? (
            <form
              id="platform-user-edit-form"
              className="grid gap-4 md:grid-cols-2"
              onSubmit={handleUpdateUser}
            >
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Correo</span><input type="email" className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.email} onChange={(event) => setEditForm((current) => current ? { ...current, email: event.target.value } : current)} required /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Estado</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.status} onChange={(event) => setEditForm((current) => current ? { ...current, status: event.target.value as typeof editForm.status } : current)}><option value="ACTIVE">Activo</option><option value="INVITED">Invitado</option><option value="SUSPENDED">Suspendido</option><option value="DISABLED">Deshabilitado</option></select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nombres</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.firstName} onChange={(event) => setEditForm((current) => current ? { ...current, firstName: event.target.value } : current)} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Apellidos</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.lastName} onChange={(event) => setEditForm((current) => current ? { ...current, lastName: event.target.value } : current)} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Tipo documento</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.documentType} onChange={(event) => setEditForm((current) => current ? { ...current, documentType: event.target.value as typeof editForm.documentType } : current)}><option value="DNI">DNI</option><option value="RUC">RUC</option><option value="CE">CE</option><option value="PASSPORT">Pasaporte</option></select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Numero documento</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.documentNumber} onChange={(event) => setEditForm((current) => current ? { ...current, documentNumber: event.target.value } : current)} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Telefono</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.phone} onChange={(event) => setEditForm((current) => current ? { ...current, phone: event.target.value } : current)} /></label>
              <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#0D0D0D]">Rol de plataforma</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={editForm.platformRoleScopeKey} onChange={(event) => setEditForm((current) => current ? { ...current, platformRoleScopeKey: event.target.value } : current)}><option value="">Sin acceso de plataforma</option>{platformRoles.map((role) => (<option key={role.id} value={role.scopeKey}>{role.name}</option>))}</select></label>
              <div className="space-y-3 md:col-span-2">
                <p className="text-sm font-semibold text-[#0D0D0D]">Permisos de plataforma</p>
                <p className="text-xs leading-6 text-[#667053]">
                  Estos botones ajustan permisos especificos encima del rol de plataforma. Activo significa permitido; al apagarlo queda denegado para este usuario.
                </p>
                <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1">
                  {platformPermissions.map((permission) => {
                    const active = getEffectivePermissionKeys(
                      selectedUser.platformRolePermissionKeys,
                      editForm.platformOverrides,
                    ).includes(permission.key);

                    return (
                      <AdminActionButton
                        key={permission.id}
                        type="button"
                        tone="secondary"
                        active={active}
                        size="sm"
                        onClick={() =>
                          setEditForm((current) =>
                            current
                              ? {
                                  ...current,
                                  platformOverrides: toggleOverride(
                                    selectedUser.platformRolePermissionKeys,
                                    current.platformOverrides,
                                    permission.key,
                                  ),
                                }
                              : current,
                          )
                        }
                      >
                        {permission.name}
                      </AdminActionButton>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-4 md:col-span-2">
                <p className="text-sm font-semibold text-[#0D0D0D]">Accesos por organizacion</p>
                {selectedUser.memberships.length > 0 ? (
                  selectedUser.memberships.map((membership) => {
                    const membershipOverrides =
                      editForm.membershipOverrides[membership.id] ?? {
                        allowPermissionKeys: [],
                        denyPermissionKeys: [],
                      };
                    const effectiveMembershipPermissions = getEffectivePermissionKeys(
                      membership.rolePermissionKeys,
                      membershipOverrides,
                    );

                    return (
                      <article key={membership.id} className="rounded-[24px] border border-[#E4E4E4] min-h-[800px] bg-[#F8F8F8] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#0D0D0D]">
                              {membership.organizationName}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#A1A1A1]">
                              {(membership.roleNames.length > 0
                                ? membership.roleNames
                                : membership.roleKeys
                              ).join(", ") || "Sin rol"}
                            </p>
                          </div>
                          <AdminActionButton
                            type="button"
                            tone="danger"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => void handleUnlinkMembership(membership.id)}
                          >
                            Desvincular
                          </AdminActionButton>
                        </div>
                        {renderMembershipPermissionMatrix(
                          membership,
                          membershipOverrides,
                          effectiveMembershipPermissions,
                        )}
                      </article>
                    );
                  })
                ) : (
                  <AdminMessage
                    title="Sin organizaciones vinculadas"
                    description="Usa el boton Editar acceso para asignar una organizacion y un rol base."
                  />
                )}
              </div>
            </form>
          ) : overlayMode === "assign" && membershipForm ? (
            <form
              id="platform-membership-form"
              className="grid gap-4 md:grid-cols-2"
              onSubmit={handleAssignMembership}
            >
              <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#0D0D0D]">Organizacion</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={membershipForm.organizationId} onChange={(event) => { const organizationId = event.target.value; setMembershipForm((current) => current ? { ...current, organizationId, roleScopeKey: "" } : current); void loadMembershipRoleOptions(organizationId); }} required><option value="">Selecciona una organizacion</option>{organizations.map((organization) => (<option key={organization.id} value={organization.id}>{organization.tradeName ?? organization.legalName}</option>))}</select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Rol</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={membershipForm.roleScopeKey} onChange={(event) => setMembershipForm((current) => current ? { ...current, roleScopeKey: event.target.value } : current)}><option value="">Sin rol inicial</option>{membershipRoleOptions.map((role) => (<option key={role.id} value={role.scopeKey}>{role.isSystem === false ? "Personalizado - " : ""}{role.name}</option>))}</select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Estado membership</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={membershipForm.status} onChange={(event) => setMembershipForm((current) => current ? { ...current, status: event.target.value as typeof membershipForm.status } : current)}><option value="ACTIVE">Activa</option><option value="INVITED">Invitada</option><option value="SUSPENDED">Suspendida</option><option value="INACTIVE">Inactiva</option><option value="TERMINATED">Terminada</option></select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Cargo</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={membershipForm.title} onChange={(event) => setMembershipForm((current) => current ? { ...current, title: event.target.value } : current)} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Codigo interno</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={membershipForm.employeeCode} onChange={(event) => setMembershipForm((current) => current ? { ...current, employeeCode: event.target.value } : current)} /></label>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[28px] border border-[#e7edd5] bg-white/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#00C70D]">
                    Identidad
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[#18200f]">
                    {selectedUser.name ?? "Sin nombre"}
                  </p>
                  <p className="mt-2 text-sm text-[#535353]">
                    {[selectedUser.email, selectedUser.identifier].filter(Boolean).join(" · ") ||
                      "Sin identificador"}
                  </p>
                </article>

                <article className="rounded-[28px] border border-[#e7edd5] bg-[linear-gradient(135deg,#fcffe9_0%,#f6fadf_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#00C70D]">
                    Alcance
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Tag tone={selectedUser.scope === "PLATFORM" ? "dark" : "accent"}>
                      {formatGlobalUserScope(selectedUser.scope)}
                    </Tag>
                    <Tag
                      tone={
                        selectedUser.status === "ACTIVE"
                          ? "accent"
                          : selectedUser.status === "INVITED"
                            ? "warn"
                            : "dark"
                      }
                    >
                      {formatUserStatus(selectedUser.status)}
                    </Tag>
                  </div>
                </article>
              </div>

              <article className="rounded-[26px] border border-[#E4E4E4] bg-[#F8F8F8] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a9668]">
                  Organizaciones vinculadas
                </p>
                <div className="mt-4 space-y-3">
                  {selectedUser.memberships.length > 0 ? (
                    selectedUser.memberships.map((membership) => (
                      <div key={membership.id} className="rounded-[22px] border border-[#e7edd5] bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#1c2511]">
                              {membership.organizationName}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#83905f]">
                              {membership.organizationSlug}
                            </p>
                          </div>
                          <Tag tone={membership.status === "ACTIVE" ? "accent" : "soft"}>
                            {membership.status}
                          </Tag>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(membership.roleNames.length > 0
                            ? membership.roleNames
                            : membership.roleKeys
                          ).map((roleName) => (
                            <Tag key={roleName} tone="soft">
                              {roleName}
                            </Tag>
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-[#535353]">
                          {membership.permissionKeys.length} permisos efectivos en esta organizacion.
                        </p>
                        <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                          {membership.permissionKeys.slice(0, 24).map((permissionKey) => (
                            <span key={permissionKey} className="rounded-full bg-[#f2f7df] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#65783a]">
                              {permissionKey}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#535353]">
                      Sin relaciones activas por ahora.
                    </p>
                  )}
                </div>
              </article>

              <article className="rounded-[26px] border border-[#E4E4E4] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a9668]">
                  Plataforma Kapos
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(selectedUser.platformRoleNames.length > 0
                    ? selectedUser.platformRoleNames
                    : selectedUser.platformRoleScopeKeys
                  ).map((roleName) => (
                    <Tag key={roleName} tone="dark">
                      {roleName}
                    </Tag>
                  ))}
                  {selectedUser.platformRoleScopeKeys.length === 0 ? (
                    <p className="text-sm text-[#535353]">
                      Este usuario no tiene acceso de plataforma.
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 text-sm text-[#535353]">
                  {selectedUser.platformPermissionKeys.length} permisos de plataforma.{" "}
                  {selectedUser.effectivePermissionKeys.length} permisos efectivos en total.
                </p>
                <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                  {selectedUser.platformPermissionKeys.slice(0, 24).map((permissionKey) => (
                    <span key={permissionKey} className="rounded-full bg-[#111] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-white">
                      {permissionKey}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          )
        ) : null}
      </AdminOverlayPanel>
    </section>
  );
}
