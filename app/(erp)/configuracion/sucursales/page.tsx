"use client";

import { useEffect, useState } from "react";
import { AdminActionButton, ArrowLeftIcon, PencilIcon, PlusIcon, TrashIcon } from "../../../components/admin/AdminActionButton";
import { AdminDataTable, createLocalAdminTableFetch } from "../../../components/admin/AdminDataTable";
import { AdminMessage, AdminPageHeader, PanelCard, StatCard, Tag } from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import { createBranch, getBranches, updateBranch } from "../../../lib/erp-api";
import type { BranchSummary } from "../../../types/erp";

export default function ConfigSucursalesPage() {
  const { accessToken, activeOrganizationId, activeOrganization, effectivePermissionKeys, refreshSession } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState({ code: "", name: "", address: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [selectedBranch, setSelectedBranch] = useState<BranchSummary | null>(null);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
    status: "ACTIVE" as BranchSummary["status"],
  });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function fetchBranches(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const rows = await getBranches({ accessToken: token, organizationId: activeOrganizationId });
    setBranches(rows);
    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (branch, search) => [branch.name, branch.code, branch.address, branch.phone, branch.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  useEffect(() => setReloadKey((current) => current + 1), [activeOrganizationId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await createBranch({ accessToken: token, organizationId: activeOrganizationId, body: form });
      setForm({ code: "", name: "", address: "", phone: "" });
      setReloadKey((current) => current + 1);
      setViewMode("table");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la sucursal.");
    }
  }

  function openBranchEditor(branch: BranchSummary) {
    setSelectedBranch(branch);
    setEditForm({
      code: branch.code ?? "",
      name: branch.name,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      status: branch.status,
    });
  }

  async function handleUpdateBranch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedBranch) return;
    setError(null);
    try {
      await updateBranch({
        accessToken: token,
        organizationId: activeOrganizationId,
        branchId: selectedBranch.id,
        body: editForm,
      });
      setSelectedBranch(null);
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo editar la sucursal.");
    }
  }

  async function toggleBranchStatus(branch: BranchSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await updateBranch({
        accessToken: token,
        organizationId: activeOrganizationId,
        branchId: branch.id,
        body: { status: branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
      });
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo cambiar el estado de la sucursal.");
    }
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        eyebrow="Configuracion"
        title="Sucursales"
        description="Sedes donde operaran caja, stock, POS y reportes."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? (
              <AdminActionButton onClick={() => setViewMode("table")} icon={<ArrowLeftIcon />} tone="ghost">
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton onClick={() => setViewMode("create")} icon={<PlusIcon />} tone="primary" active={viewMode === "create"}>
              Crear sucursal
            </AdminActionButton>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Organizacion" value={activeOrganization?.organizationName ?? "..."} hint="Contexto activo." tone="dark" />
        <StatCard label="Sucursales" value={String(branches.length)} hint="Sedes configuradas." tone="accent" />
        <StatCard label="Activas" value={String(branches.filter((branch) => branch.status === "ACTIVE").length)} hint="Disponibles para operar." />
      </div>
      {error ? <AdminMessage title="No pudimos crear la sucursal" description={error} tone="warn" /> : null}
      {viewMode === "create" ? (
        <PanelCard title="Crear sucursal" description="Alta rapida de sede para comenzar a operar caja y stock.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {[
              ["code", "Codigo", "CENTRO"],
              ["name", "Nombre", "Sucursal Centro"],
              ["address", "Direccion", "Av. Principal 123"],
              ["phone", "Telefono", "+51 999 999 999"],
            ].map(([key, label, placeholder]) => (
              <label key={key} className="space-y-2">
                <span className="text-sm font-semibold text-[#21300f]">{label}</span>
                <input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder={placeholder} value={form[key as keyof typeof form]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} required={key === "name"} />
              </label>
            ))}
            <div className="flex justify-end">
              <AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Crear sucursal</AdminActionButton>
            </div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Tabla de sucursales" description="Listado real de sedes de la organizacion activa.">
          <AdminDataTable
            fetchData={fetchBranches}
            reloadKey={reloadKey}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar sucursal..."
            emptyTitle="Aun no hay sucursales"
            emptyDescription="Crea la primera sede para poder manejar stock y caja."
            columns={[
              { key: "name", label: "Sucursal", render: (row) => <div><p className="font-semibold text-[#1b2111]">{row.name}</p><p className="text-xs text-[#7a845f]">{row.code ?? "sin codigo"}</p></div> },
              { key: "address", label: "Direccion", render: (row) => row.address ?? "Sin direccion" },
              { key: "phone", label: "Telefono", render: (row) => row.phone ?? "Sin telefono" },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.status === "ACTIVE" ? "accent" : "soft"}>{row.status}</Tag> },
            ]}
            actions={[
              { label: "Editar", permission: "settings.branches.update", icon: <PencilIcon />, onClick: openBranchEditor },
              { label: "Activar", permission: "settings.branches.activate", tone: "accent", icon: <PlusIcon />, visible: (row) => row.status !== "ACTIVE", onClick: toggleBranchStatus },
              { label: "Desactivar", permission: "settings.branches.update", tone: "warn", icon: <TrashIcon />, visible: (row) => row.status === "ACTIVE", onClick: toggleBranchStatus },
            ]}
          />
        </PanelCard>
      )}

      <AdminOverlayPanel
        open={Boolean(selectedBranch)}
        onClose={() => setSelectedBranch(null)}
        eyebrow="Sucursal"
        title="Editar sucursal"
        description="Las sucursales no se eliminan fisicamente; se desactivan para conservar historial."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedBranch(null)}>Cancelar</AdminActionButton>
            <AdminActionButton tone="primary" onClick={() => (document.getElementById("branch-edit-form") as HTMLFormElement | null)?.requestSubmit()}>Guardar cambios</AdminActionButton>
          </div>
        }
      >
        <form id="branch-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateBranch}>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Codigo</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.code} onChange={(event) => setEditForm((current) => ({ ...current, code: event.target.value }))} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Direccion</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.address} onChange={(event) => setEditForm((current) => ({ ...current, address: event.target.value }))} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Telefono</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.phone} onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Estado</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as BranchSummary["status"] }))}><option value="ACTIVE">Activa</option><option value="INACTIVE">Inactiva</option><option value="CLOSED">Cerrada</option></select></label>
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
