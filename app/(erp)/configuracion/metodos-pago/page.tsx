"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, WalletCards } from "lucide-react";
import { AdminActionButton, ArrowLeftIcon, PencilIcon, PlusIcon, TrashIcon } from "../../../components/admin/AdminActionButton";
import { AdminDataTable, createLocalAdminTableFetch } from "../../../components/admin/AdminDataTable";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import { createPaymentMethod, deletePaymentMethod, getPaymentMethods, updatePaymentMethod } from "../../../lib/erp-api";
import type { PaymentMethodSummary } from "../../../types/erp";

const inputClass =
  "w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]";

const paymentTypes: Array<PaymentMethodSummary["type"]> = [
  "CASH",
  "CARD",
  "DIGITAL_WALLET",
  "BANK_TRANSFER",
  "CREDIT",
  "OTHER",
];

function paymentTypeLabel(type: PaymentMethodSummary["type"]) {
  return {
    CASH: "Efectivo",
    CARD: "Tarjeta",
    DIGITAL_WALLET: "Billetera digital",
    BANK_TRANSFER: "Transferencia",
    CREDIT: "Credito",
    OTHER: "Otro",
  }[type];
}

export default function MetodosPagoPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodSummary[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "CASH" as PaymentMethodSummary["type"],
    sortOrder: "0",
  });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodSummary | null>(null);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    type: "CASH" as PaymentMethodSummary["type"],
    sortOrder: "0",
    enabled: true,
  });

  const canCreate = effectivePermissionKeys.includes("settings.payment_methods.create");
  const canUpdate = effectivePermissionKeys.includes("settings.payment_methods.update");
  const canActivate = effectivePermissionKeys.includes("settings.payment_methods.activate");
  const canDelete = effectivePermissionKeys.includes("settings.payment_methods.delete");

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function fetchPaymentMethods(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const rows = await getPaymentMethods({ accessToken: token, organizationId: activeOrganizationId });
    setMethods(rows);
    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (method, search) =>
        [method.code, method.name, method.type, paymentTypeLabel(method.type)]
          .some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    setSuccess(null);
    try {
      await createPaymentMethod({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          code: form.code,
          name: form.name,
          type: form.type,
          enabled: true,
          sortOrder: Number(form.sortOrder || "0"),
        },
      });
      setForm({ code: "", name: "", type: "CASH", sortOrder: "0" });
      setReloadKey((current) => current + 1);
      setViewMode("table");
      setSuccess("Metodo de pago creado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear el metodo de pago.");
    }
  }

  function openMethodEditor(method: PaymentMethodSummary) {
    setSelectedMethod(method);
    setEditForm({
      code: method.code,
      name: method.name,
      type: method.type,
      sortOrder: String(method.sortOrder),
      enabled: method.enabled,
    });
    setError(null);
    setSuccess(null);
  }

  async function handleUpdateMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedMethod) return;
    setError(null);
    setSuccess(null);
    try {
      await updatePaymentMethod({
        accessToken: token,
        organizationId: activeOrganizationId,
        paymentMethodId: selectedMethod.id,
        body: {
          code: editForm.code,
          name: editForm.name,
          type: editForm.type,
          sortOrder: Number(editForm.sortOrder || "0"),
          enabled: editForm.enabled,
        },
      });
      setSelectedMethod(null);
      setReloadKey((current) => current + 1);
      setSuccess("Metodo de pago actualizado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo editar el metodo de pago.");
    }
  }

  async function toggleMethodStatus(method: PaymentMethodSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    setSuccess(null);
    try {
      await updatePaymentMethod({
        accessToken: token,
        organizationId: activeOrganizationId,
        paymentMethodId: method.id,
        body: { enabled: !method.enabled },
      });
      setReloadKey((current) => current + 1);
      setSuccess(method.enabled ? "Metodo de pago desactivado." : "Metodo de pago activado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo cambiar el estado del metodo de pago.");
    }
  }

  async function removeMethod(method: PaymentMethodSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    if (!window.confirm(`Eliminar el metodo de pago ${method.name}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await deletePaymentMethod({
        accessToken: token,
        organizationId: activeOrganizationId,
        paymentMethodId: method.id,
      });
      setReloadKey((current) => current + 1);
      setSuccess("Metodo de pago eliminado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo eliminar el metodo de pago.");
    }
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Configuracion"
        title="Metodos de pago"
        description="Configura las formas de cobro que caja y POS podran usar: efectivo, Yape, Plin, tarjeta, transferencia o credito."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? (
              <AdminActionButton onClick={() => setViewMode("table")} icon={<ArrowLeftIcon />} tone="ghost">
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            {canCreate ? (
              <AdminActionButton onClick={() => setViewMode("create")} icon={<PlusIcon />} tone="primary" active={viewMode === "create"}>
                Crear metodo
              </AdminActionButton>
            ) : (
              <WalletCards className="h-6 w-6 text-[#6d8a20]" />
            )}
          </div>
        }
        stats={[
          { label: "Metodos", value: String(methods.length), hint: "Formas de pago configuradas.", tone: "dark" },
          { label: "Activos", value: String(methods.filter((method) => method.enabled).length), hint: "Disponibles para vender.", tone: "accent" },
          { label: "Uso", value: "Caja y POS", hint: "Se seleccionan al registrar cobros." },
        ]}
      />

      {error ? <AdminMessage title="No pudimos guardar" description={error} tone="warn" /> : null}
      {success ? <AdminMessage title="Operacion completada" description={success} tone="accent" /> : null}

      {viewMode === "create" ? (
        <PanelCard title="Crear metodo de pago" description="Ejemplos recomendados para el piloto: efectivo, tarjeta, Yape, Plin y transferencia.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Codigo</span><input className={`${inputClass} lowercase`} placeholder="yape" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toLowerCase() }))} required /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className={inputClass} placeholder="Yape" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Tipo</span><select className={inputClass} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PaymentMethodSummary["type"] }))}>{paymentTypes.map((type) => <option key={type} value={type}>{paymentTypeLabel(type)}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Orden</span><input type="number" className={inputClass} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
            <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Crear metodo</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Lista de metodos de pago" description="Esta lista alimenta caja, POS restaurante y cobros de ventas rapidas.">
          <AdminDataTable
            fetchData={fetchPaymentMethods}
            reloadKey={`${activeOrganizationId ?? ""}-${reloadKey}`}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar por metodo, codigo o tipo..."
            emptyTitle="Aun no hay metodos de pago"
            emptyDescription="Crea efectivo, tarjeta, Yape, Plin o transferencia para preparar caja."
            columns={[
              { key: "name", label: "Metodo", render: (row) => <div><p className="font-semibold text-[#1b2111]">{row.name}</p><p className="text-xs text-[#7a845f]">{row.code}</p></div> },
              { key: "type", label: "Tipo", render: (row) => paymentTypeLabel(row.type) },
              { key: "order", label: "Orden", align: "center", render: (row) => row.sortOrder },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.enabled ? "accent" : "soft"}>{row.enabled ? "Activo" : "Inactivo"}</Tag> },
            ]}
            actions={[
              { label: "Editar", permission: "settings.payment_methods.update", icon: <PencilIcon />, onClick: openMethodEditor },
              { label: "Activar", permission: "settings.payment_methods.activate", tone: "accent", icon: <PlusIcon />, visible: (row) => !row.enabled, onClick: toggleMethodStatus },
              { label: "Desactivar", permission: "settings.payment_methods.update", tone: "warn", icon: <CreditCard className="h-4 w-4" />, visible: (row) => row.enabled, onClick: toggleMethodStatus },
              { label: "Eliminar", permission: "settings.payment_methods.delete", tone: "warn", icon: <TrashIcon />, onClick: removeMethod },
            ]}
          />
        </PanelCard>
      )}

      <AdminOverlayPanel
        open={Boolean(selectedMethod)}
        onClose={() => setSelectedMethod(null)}
        eyebrow="Metodo de pago"
        title="Editar metodo"
        description="Si ya fue usado, desactivalo en vez de eliminarlo para mantener intactos los historiales."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedMethod(null)}>Cancelar</AdminActionButton>
            <AdminActionButton tone="primary" onClick={() => (document.getElementById("payment-method-edit-form") as HTMLFormElement | null)?.requestSubmit()}>Guardar cambios</AdminActionButton>
          </div>
        }
      >
        <form id="payment-method-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateMethod}>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Codigo</span><input className={`${inputClass} lowercase`} value={editForm.code} onChange={(event) => setEditForm((current) => ({ ...current, code: event.target.value.toLowerCase() }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className={inputClass} value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Tipo</span><select className={inputClass} value={editForm.type} onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value as PaymentMethodSummary["type"] }))}>{paymentTypes.map((type) => <option key={type} value={type}>{paymentTypeLabel(type)}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Orden</span><input type="number" className={inputClass} value={editForm.sortOrder} onChange={(event) => setEditForm((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Estado</span><select className={inputClass} value={editForm.enabled ? "ACTIVE" : "INACTIVE"} onChange={(event) => setEditForm((current) => ({ ...current, enabled: event.target.value === "ACTIVE" }))}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></select></label>
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
