"use client";

import { useEffect, useState } from "react";
import {
  AdminActionButton,
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  SparkIcon,
  TrashIcon,
} from "../../../components/admin/AdminActionButton";
import { AdminDataTable } from "../../../components/admin/AdminDataTable";
import {
  AdminMessage,
  AdminPageHeader,
  PanelCard,
  StatCard,
  Tag,
} from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import {
  createInternalUser,
  getInternalRoles,
  getInternalUsers,
  reactivateInternalUser,
  suspendInternalUser,
  updateInternalUser,
} from "../../../lib/erp-api";
import type { InternalRoleSummary, InternalUserSummary } from "../../../types/erp";

type UserForm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentType: "DNI" | "CE" | "PASSPORT";
  documentNumber: string;
  phone: string;
  title: string;
  employeeCode: string;
  membershipStatus: InternalUserSummary["status"];
  userStatus: InternalUserSummary["user"]["status"];
  roleScopeKeys: string[];
};

function emptyUserForm(): UserForm {
  return {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    documentType: "DNI",
    documentNumber: "",
    phone: "",
    title: "",
    employeeCode: "",
    membershipStatus: "ACTIVE",
    userStatus: "ACTIVE",
    roleScopeKeys: [],
  };
}

function userDisplayName(member: InternalUserSummary) {
  const name = [member.user.firstName, member.user.lastName].filter(Boolean).join(" ");
  return name || member.user.email || "Usuario sin nombre";
}

export default function ConfigUsuariosPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [members, setMembers] = useState<InternalUserSummary[]>([]);
  const [roles, setRoles] = useState<InternalRoleSummary[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState<"table" | "create">("table");
  const [form, setForm] = useState<UserForm>(emptyUserForm());
  const [selectedMember, setSelectedMember] = useState<InternalUserSummary | null>(null);
  const [editForm, setEditForm] = useState<UserForm>(emptyUserForm());
  const [error, setError] = useState<string | null>(null);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadRoles() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return [];
    const response = await getInternalRoles({
      accessToken: token,
      organizationId: activeOrganizationId,
      page: 1,
      limit: 100,
    });
    setRoles(response.data);
    return response.data;
  }

  async function fetchUsers(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const [response] = await Promise.all([
      getInternalUsers({
        accessToken: token,
        organizationId: activeOrganizationId,
        page: input.page,
        limit: input.limit,
        search: input.search,
      }),
      loadRoles(),
    ]);
    setMembers(response.data);
    return { data: response.data, total: response.total };
  }

  useEffect(() => setReloadKey((current) => current + 1), [activeOrganizationId]);

  function toggleRole(target: "create" | "edit", scopeKey: string) {
    const updater = (current: UserForm) => ({
      ...current,
      roleScopeKeys: current.roleScopeKeys.includes(scopeKey)
        ? current.roleScopeKeys.filter((key) => key !== scopeKey)
        : [...current.roleScopeKeys, scopeKey],
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
      await createInternalUser({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          email: form.email,
          password: form.password || undefined,
          firstName: form.firstName,
          lastName: form.lastName,
          documentType: form.documentNumber ? form.documentType : undefined,
          documentNumber: form.documentNumber,
          phone: form.phone,
          title: form.title,
          employeeCode: form.employeeCode,
          membershipStatus: form.membershipStatus,
          roleScopeKeys: form.roleScopeKeys,
        },
      });
      setForm(emptyUserForm());
      setMode("table");
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear el usuario.");
    }
  }

  function openEditor(member: InternalUserSummary) {
    setSelectedMember(member);
    setEditForm({
      email: member.user.email ?? "",
      password: "",
      firstName: member.user.firstName ?? "",
      lastName: member.user.lastName ?? "",
      documentType: member.user.documentType ?? "DNI",
      documentNumber: member.user.documentNumber ?? "",
      phone: member.user.phone ?? "",
      title: member.title ?? "",
      employeeCode: member.employeeCode ?? "",
      membershipStatus: member.status,
      userStatus: member.user.status,
      roleScopeKeys: member.roleScopeKeys,
    });
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedMember) return;
    setError(null);
    try {
      await updateInternalUser({
        accessToken: token,
        organizationId: activeOrganizationId,
        membershipId: selectedMember.id,
        body: {
          title: editForm.title,
          employeeCode: editForm.employeeCode,
          membershipStatus: editForm.membershipStatus,
          roleScopeKeys: editForm.roleScopeKeys,
        },
      });
      setSelectedMember(null);
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo editar el usuario.");
    }
  }

  async function suspendMember(member: InternalUserSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await suspendInternalUser({
        accessToken: token,
        organizationId: activeOrganizationId,
        membershipId: member.id,
      });
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo suspender el usuario.");
    }
  }

  async function reactivateMember(member: InternalUserSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await reactivateInternalUser({
        accessToken: token,
        organizationId: activeOrganizationId,
        membershipId: member.id,
      });
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo reactivar el usuario.");
    }
  }

  function renderRoleSelector(target: "create" | "edit", values: string[]) {
    return (
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <AdminActionButton
            key={role.scopeKey}
            size="sm"
            tone={role.isSystem ? "secondary" : "accent"}
            active={values.includes(role.scopeKey)}
            onClick={() => toggleRole(target, role.scopeKey)}
          >
            {role.name}
          </AdminActionButton>
        ))}
      </div>
    );
  }

  function renderUserFields(target: "create" | "edit", values: UserForm, setValues: React.Dispatch<React.SetStateAction<UserForm>>) {
    const editingMembershipOnly = target === "edit";

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Correo</span><input type="email" className={`w-full rounded-[20px] border border-[#e2e8d0] px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24] ${editingMembershipOnly ? "bg-[#f8faf2] text-[#6c755c]" : "bg-white"}`} value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value.toLowerCase() }))} disabled={editingMembershipOnly} required /></label>
        {target === "create" ? (
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Contrasena temporal</span><input type="password" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder="Opcional: si queda vacio sera invitado" value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} /></label>
        ) : (
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Estado global</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-[#f8faf2] px-4 py-3 text-sm text-[#6c755c] outline-none" value={values.userStatus} disabled /></label>
        )}
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombres</span><input className={`w-full rounded-[20px] border border-[#e2e8d0] px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24] ${editingMembershipOnly ? "bg-[#f8faf2] text-[#6c755c]" : "bg-white"}`} value={values.firstName} onChange={(event) => setValues((current) => ({ ...current, firstName: event.target.value }))} disabled={editingMembershipOnly} /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Apellidos</span><input className={`w-full rounded-[20px] border border-[#e2e8d0] px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24] ${editingMembershipOnly ? "bg-[#f8faf2] text-[#6c755c]" : "bg-white"}`} value={values.lastName} onChange={(event) => setValues((current) => ({ ...current, lastName: event.target.value }))} disabled={editingMembershipOnly} /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Tipo documento</span><select className={`w-full rounded-[20px] border border-[#e2e8d0] px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24] ${editingMembershipOnly ? "bg-[#f8faf2] text-[#6c755c]" : "bg-white"}`} value={values.documentType} onChange={(event) => setValues((current) => ({ ...current, documentType: event.target.value as UserForm["documentType"] }))} disabled={editingMembershipOnly}><option value="DNI">DNI</option><option value="CE">CE</option><option value="PASSPORT">Pasaporte</option></select></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Documento</span><input className={`w-full rounded-[20px] border border-[#e2e8d0] px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24] ${editingMembershipOnly ? "bg-[#f8faf2] text-[#6c755c]" : "bg-white"}`} value={values.documentNumber} onChange={(event) => setValues((current) => ({ ...current, documentNumber: event.target.value }))} disabled={editingMembershipOnly} /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Telefono</span><input className={`w-full rounded-[20px] border border-[#e2e8d0] px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24] ${editingMembershipOnly ? "bg-[#f8faf2] text-[#6c755c]" : "bg-white"}`} value={values.phone} onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))} disabled={editingMembershipOnly} /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Cargo</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder="Cajero, supervisor..." value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Codigo interno</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={values.employeeCode} onChange={(event) => setValues((current) => ({ ...current, employeeCode: event.target.value }))} /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Estado en organizacion</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={values.membershipStatus} onChange={(event) => setValues((current) => ({ ...current, membershipStatus: event.target.value as UserForm["membershipStatus"] }))}><option value="ACTIVE">Activo</option><option value="INVITED">Invitado</option><option value="SUSPENDED">Suspendido</option><option value="INACTIVE">Inactivo</option><option value="TERMINATED">Terminado</option></select></label>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        eyebrow="Configuracion"
        title="Usuarios internos"
        description="Invita o vincula usuarios a la organizacion activa, asigna roles y suspende accesos sin borrar historial."
        action={
          <div className="flex gap-2">
            {mode === "create" ? (
              <AdminActionButton tone="ghost" icon={<ArrowLeftIcon />} onClick={() => setMode("table")}>
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton tone="primary" active={mode === "create"} icon={<PlusIcon />} onClick={() => setMode("create")}>Crear usuario</AdminActionButton>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Usuarios" value={String(members.length)} hint="Miembros cargados en tabla." tone="dark" />
        <StatCard label="Activos" value={String(members.filter((member) => member.status === "ACTIVE").length)} hint="Pueden operar." tone="accent" />
        <StatCard label="Roles disponibles" value={String(roles.length)} hint="Asignables en esta organizacion." />
      </div>
      {error ? <AdminMessage title="No pudimos completar la accion" description={error} tone="warn" /> : null}

      {mode === "create" ? (
        <PanelCard title="Crear o vincular usuario" description="Si el correo ya existe, se vincula a esta organizacion; si no existe, se crea.">
          <form className="space-y-5" onSubmit={handleCreate}>
            {renderUserFields("create", form, setForm)}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#21300f]">Roles</p>
              {renderRoleSelector("create", form.roleScopeKeys)}
            </div>
            <div className="flex justify-end gap-3">
              <AdminActionButton tone="ghost" onClick={() => setMode("table")}>Cancelar</AdminActionButton>
              <AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Guardar usuario</AdminActionButton>
            </div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Tabla de usuarios" description="Accesos internos de la organizacion activa.">
          <AdminDataTable
            fetchData={fetchUsers}
            reloadKey={reloadKey}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar usuario..."
            emptyTitle="Aun no hay usuarios internos"
            emptyDescription="Crea o vincula el primer colaborador de esta organizacion."
            columns={[
              { key: "user", label: "Usuario", render: (row) => <div><p className="font-semibold text-[#1b2111]">{userDisplayName(row)}</p><p className="text-xs text-[#7a845f]">{row.user.email ?? row.user.documentNumber ?? "sin identificador"}</p></div> },
              { key: "title", label: "Cargo", render: (row) => row.title ?? "Sin cargo" },
              { key: "roles", label: "Roles", render: (row) => <div className="flex flex-wrap gap-1">{row.roles.slice(0, 2).map((role) => <Tag key={role.scopeKey} tone={role.isSystem ? "dark" : "accent"}>{role.name}</Tag>)}{row.roles.length > 2 ? <Tag>+{row.roles.length - 2}</Tag> : null}</div> },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.status === "ACTIVE" ? "accent" : row.status === "SUSPENDED" ? "warn" : "soft"}>{row.status}</Tag> },
            ]}
            actions={[
              { label: "Editar", permission: "settings.users.update", icon: <PencilIcon />, onClick: openEditor },
              { label: "Suspender", permission: "settings.users.update", tone: "warn", icon: <TrashIcon />, visible: (row) => row.status !== "SUSPENDED", onClick: suspendMember },
              { label: "Reactivar", permission: "settings.users.activate", tone: "accent", icon: <SparkIcon />, visible: (row) => row.status === "SUSPENDED", onClick: reactivateMember },
            ]}
          />
        </PanelCard>
      )}

      <AdminOverlayPanel
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        eyebrow="Usuario interno"
        title="Editar usuario y roles"
        description="Aqui solo se edita el acceso dentro de esta organizacion. Los datos personales globales deben vivir en Perfil."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedMember(null)}>Cancelar</AdminActionButton>
            <AdminActionButton tone="primary" onClick={() => (document.getElementById("internal-user-edit-form") as HTMLFormElement | null)?.requestSubmit()}>Guardar cambios</AdminActionButton>
          </div>
        }
      >
        <form id="internal-user-edit-form" className="space-y-5" onSubmit={handleUpdate}>
          {renderUserFields("edit", editForm, setEditForm)}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#21300f]">Roles</p>
            {renderRoleSelector("edit", editForm.roleScopeKeys)}
          </div>
          <div className="rounded-[24px] border border-[#edf1e4] bg-[#fbfcf8] p-4">
            <p className="text-sm font-semibold text-[#21300f]">Permisos efectivos</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(selectedMember?.effectivePermissionKeys ?? []).slice(0, 24).map((key) => <Tag key={key}>{key}</Tag>)}
              {(selectedMember?.effectivePermissionKeys.length ?? 0) > 24 ? <Tag tone="dark">+{(selectedMember?.effectivePermissionKeys.length ?? 0) - 24}</Tag> : null}
            </div>
          </div>
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
