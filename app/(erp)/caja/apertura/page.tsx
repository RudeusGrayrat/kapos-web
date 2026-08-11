"use client";

import { useEffect, useState } from "react";
import {
  AdminActionButton,
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "../../../components/admin/AdminActionButton";
import {
  AdminDataTable,
  createLocalAdminTableFetch,
} from "../../../components/admin/AdminDataTable";
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
  createCashRegister,
  getBranches,
  getCashRegisters,
  getCashSessions,
  openCashSession,
  updateCashRegister,
} from "../../../lib/erp-api";
import type {
  BranchSummary,
  CashRegisterSummary,
  CashSessionSummary,
} from "../../../types/erp";

export default function CajaAperturaPage() {
  const {
    accessToken,
    activeOrganizationId,
    effectivePermissionKeys,
    refreshSession,
  } = useAuth();
  const [registers, setRegisters] = useState<CashRegisterSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [openSessions, setOpenSessions] = useState<CashSessionSummary[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "create-register" | "open-session">("table");
  const [registerForm, setRegisterForm] = useState({
    branchId: "",
    code: "",
    name: "",
    sortOrder: "0",
  });
  const [openForm, setOpenForm] = useState({
    branchId: "",
    cashRegisterId: "",
    openingAmount: "0",
    openingNote: "",
  });
  const [selectedRegister, setSelectedRegister] =
    useState<CashRegisterSummary | null>(null);
  const [editForm, setEditForm] = useState({
    branchId: "",
    code: "",
    name: "",
    sortOrder: "0",
    status: "ACTIVE" as CashRegisterSummary["status"],
  });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadBaseData() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const [registerRows, branchRows, sessionResponse] = await Promise.all([
      getCashRegisters({ accessToken: token, organizationId: activeOrganizationId }),
      getBranches({ accessToken: token, organizationId: activeOrganizationId }),
      getCashSessions({
        accessToken: token,
        organizationId: activeOrganizationId,
        page: 1,
        limit: 100,
        status: "OPEN",
      }),
    ]);
    setRegisters(registerRows);
    setBranches(branchRows.filter((branch) => branch.status === "ACTIVE"));
    setOpenSessions(sessionResponse.data);
    return { registerRows, branchRows, openRows: sessionResponse.data };
  }

  async function fetchRegisters(input: { page: number; limit: number; search: string }) {
    const { registerRows } = await loadBaseData();
    return createLocalAdminTableFetch({
      getRows: () => registerRows,
      filterRow: (register, search) =>
        [register.name, register.code, register.branch?.name, register.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  useEffect(() => setReloadKey((current) => current + 1), [activeOrganizationId]);

  async function handleCreateRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await createCashRegister({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          branchId: registerForm.branchId,
          code: registerForm.code,
          name: registerForm.name,
          sortOrder: Number(registerForm.sortOrder || "0"),
          status: "ACTIVE",
        },
      });
      setRegisterForm({ branchId: "", code: "", name: "", sortOrder: "0" });
      setReloadKey((current) => current + 1);
      setViewMode("table");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la caja.");
    }
  }

  async function handleOpenSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await openCashSession({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          branchId: openForm.branchId,
          cashRegisterId: openForm.cashRegisterId,
          openingAmount: Number(openForm.openingAmount || "0"),
          openingNote: openForm.openingNote,
        },
      });
      setOpenForm({
        branchId: "",
        cashRegisterId: "",
        openingAmount: "0",
        openingNote: "",
      });
      setReloadKey((current) => current + 1);
      setViewMode("table");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo abrir la caja.");
    }
  }

  function openRegisterEditor(register: CashRegisterSummary) {
    setSelectedRegister(register);
    setEditForm({
      branchId: register.branchId,
      code: register.code,
      name: register.name,
      sortOrder: String(register.sortOrder),
      status: register.status,
    });
  }

  async function handleUpdateRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedRegister) return;
    setError(null);
    try {
      await updateCashRegister({
        accessToken: token,
        organizationId: activeOrganizationId,
        cashRegisterId: selectedRegister.id,
        body: {
          branchId: editForm.branchId,
          code: editForm.code,
          name: editForm.name,
          sortOrder: Number(editForm.sortOrder || "0"),
          status: editForm.status,
        },
      });
      setSelectedRegister(null);
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo editar la caja.");
    }
  }

  async function toggleRegisterStatus(register: CashRegisterSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await updateCashRegister({
        accessToken: token,
        organizationId: activeOrganizationId,
        cashRegisterId: register.id,
        body: { status: register.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
      });
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo cambiar el estado de la caja.");
    }
  }

  const availableRegisters = registers.filter(
    (register) =>
      register.status === "ACTIVE" &&
      (!openForm.branchId || register.branchId === openForm.branchId),
  );

  return (
    <section className="space-y-8">
      <AdminPageHeader
        eyebrow="Caja"
        title="Apertura"
        description="Crea cajas por sucursal y abre el turno antes de vender. Una caja solo puede tener una sesion abierta."
        action={
          <div className="flex gap-3">
            {viewMode !== "table" ? (
              <AdminActionButton onClick={() => setViewMode("table")} icon={<ArrowLeftIcon />} tone="ghost">
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton onClick={() => setViewMode("create-register")} icon={<PlusIcon />} tone="secondary" active={viewMode === "create-register"}>
              Crear caja
            </AdminActionButton>
            <AdminActionButton onClick={() => setViewMode("open-session")} icon={<PlusIcon />} tone="primary" active={viewMode === "open-session"}>
              Abrir caja
            </AdminActionButton>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Cajas" value={String(registers.length)} hint="Cajas configuradas." tone="dark" />
        <StatCard label="Abiertas" value={String(openSessions.length)} hint="Sesiones listas para operar." tone="accent" />
        <StatCard label="Sucursales" value={String(branches.length)} hint="Sedes activas." />
      </div>
      {error ? <AdminMessage title="No pudimos completar la accion" description={error} tone="warn" /> : null}
      {viewMode === "create-register" ? (
          <PanelCard title="Crear caja" description="Caja fisica o logica dentro de una sucursal.">
            <form className="space-y-4" onSubmit={handleCreateRegister}>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#21300f]">Sucursal</span>
                <select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={registerForm.branchId} onChange={(event) => setRegisterForm((current) => ({ ...current, branchId: event.target.value }))} required>
                  <option value="">Selecciona sucursal</option>
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Codigo</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm lowercase outline-none transition focus:border-[#a9cf24]" placeholder="principal" value={registerForm.code} onChange={(event) => setRegisterForm((current) => ({ ...current, code: event.target.value.toLowerCase() }))} required /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" placeholder="Caja principal" value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} required /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Orden</span><input type="number" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={registerForm.sortOrder} onChange={(event) => setRegisterForm((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
              <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Crear caja</AdminActionButton></div>
            </form>
          </PanelCard>
      ) : viewMode === "open-session" ? (
          <PanelCard title="Abrir caja" description="Registra el monto inicial del turno.">
            <form className="space-y-4" onSubmit={handleOpenSession}>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#21300f]">Sucursal</span>
                <select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={openForm.branchId} onChange={(event) => setOpenForm((current) => ({ ...current, branchId: event.target.value, cashRegisterId: "" }))} required>
                  <option value="">Selecciona sucursal</option>
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#21300f]">Caja</span>
                <select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={openForm.cashRegisterId} onChange={(event) => setOpenForm((current) => ({ ...current, cashRegisterId: event.target.value }))} required>
                  <option value="">Selecciona caja</option>
                  {availableRegisters.map((register) => <option key={register.id} value={register.id}>{register.name}</option>)}
                </select>
              </label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Monto inicial</span><input type="number" step="0.01" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={openForm.openingAmount} onChange={(event) => setOpenForm((current) => ({ ...current, openingAmount: event.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nota</span><textarea className="min-h-24 w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={openForm.openingNote} onChange={(event) => setOpenForm((current) => ({ ...current, openingNote: event.target.value }))} /></label>
              <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Abrir caja</AdminActionButton></div>
            </form>
          </PanelCard>
      ) : (
        <PanelCard title="Cajas registradas" description="Administra cajas sin eliminarlas fisicamente.">
          <AdminDataTable
            fetchData={fetchRegisters}
            reloadKey={reloadKey}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar caja o sucursal..."
            emptyTitle="Aun no hay cajas"
            emptyDescription="Crea una caja para poder abrir turno."
            columns={[
              { key: "name", label: "Caja", render: (row) => <div><p className="font-semibold text-[#1b2111]">{row.name}</p><p className="text-xs text-[#7a845f]">{row.code}</p></div> },
              { key: "branch", label: "Sucursal", render: (row) => row.branch?.name ?? "Sin sucursal" },
              { key: "order", label: "Orden", align: "center", render: (row) => row.sortOrder },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.status === "ACTIVE" ? "accent" : "soft"}>{row.status}</Tag> },
            ]}
            actions={[
              { label: "Editar", permission: "cash.openings.update", icon: <PencilIcon />, onClick: openRegisterEditor },
              { label: "Activar", permission: "cash.openings.activate", tone: "accent", icon: <PlusIcon />, visible: (row) => row.status !== "ACTIVE", onClick: toggleRegisterStatus },
              { label: "Desactivar", permission: "cash.openings.update", tone: "warn", icon: <TrashIcon />, visible: (row) => row.status === "ACTIVE", onClick: toggleRegisterStatus },
            ]}
          />
        </PanelCard>
      )}

      <AdminOverlayPanel
        open={Boolean(selectedRegister)}
        onClose={() => setSelectedRegister(null)}
        eyebrow="Caja"
        title="Editar caja"
        description="Desactiva una caja cuando ya no se usa; no la borres si tuvo aperturas."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedRegister(null)}>Cancelar</AdminActionButton>
            <AdminActionButton tone="primary" onClick={() => (document.getElementById("cash-register-edit-form") as HTMLFormElement | null)?.requestSubmit()}>Guardar cambios</AdminActionButton>
          </div>
        }
      >
        <form id="cash-register-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateRegister}>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Sucursal</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.branchId} onChange={(event) => setEditForm((current) => ({ ...current, branchId: event.target.value }))}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Codigo</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm lowercase outline-none transition focus:border-[#a9cf24]" value={editForm.code} onChange={(event) => setEditForm((current) => ({ ...current, code: event.target.value.toLowerCase() }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Orden</span><input type="number" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.sortOrder} onChange={(event) => setEditForm((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Estado</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as CashRegisterSummary["status"] }))}><option value="ACTIVE">Activa</option><option value="INACTIVE">Inactiva</option><option value="ARCHIVED">Archivada</option></select></label>
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
