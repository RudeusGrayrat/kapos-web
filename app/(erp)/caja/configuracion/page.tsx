"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CreditCard, WalletCards } from "lucide-react";
import { AdminActionButton, ArrowLeftIcon, PencilIcon, PlusIcon, TrashIcon } from "../../../components/admin/AdminActionButton";
import { AdminDataTable, createLocalAdminTableFetch } from "../../../components/admin/AdminDataTable";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import { createPaymentMethod, deletePaymentMethod, getPaymentMethods, getPaymentProviderConfig, updatePaymentMethod, updatePaymentProviderConfig } from "../../../lib/erp-api";
import type { PaymentMethodSummary, PaymentProviderConfigSummary } from "../../../types/erp";

const inputClass =
  "w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]";

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
  const [izipay, setIzipay] = useState<PaymentProviderConfigSummary | null>(null);
  const [izipayForm, setIzipayForm] = useState({ environment: "TEST" as "TEST" | "PRODUCTION", merchantCode: "", facilitatorCode: "", apiKey: "", enabled: false });
  const [izipayBusy, setIzipayBusy] = useState(false);

  const canCreate = effectivePermissionKeys.includes("cash.payment_methods.create");

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadIzipayConfig() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    try {
      const config = await getPaymentProviderConfig({ accessToken: token, organizationId: activeOrganizationId });
      setIzipay(config);
      setIzipayForm({ environment: config.environment, merchantCode: config.merchantCode, facilitatorCode: config.facilitatorCode ?? "", apiKey: "", enabled: config.enabled });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar Izipay.");
    }
  }

  useEffect(() => { void loadIzipayConfig(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeOrganizationId]);

  async function saveIzipay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setIzipayBusy(true); setError(null); setSuccess(null);
    try {
      const config = await updatePaymentProviderConfig({
        accessToken: token, organizationId: activeOrganizationId,
        body: { environment: izipayForm.environment, merchantCode: izipayForm.merchantCode, facilitatorCode: izipayForm.facilitatorCode || undefined, apiKey: izipayForm.apiKey || undefined, enabled: izipayForm.enabled },
      });
      setIzipay(config);
      setIzipayForm((current) => ({ ...current, apiKey: "" }));
      setSuccess("Configuración Izipay guardada. La clave queda cifrada y no vuelve al navegador.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar Izipay.");
    } finally { setIzipayBusy(false); }
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
        eyebrow="Caja"
        title="Configuración de caja"
        description="Configura las formas de cobro que caja y pedidos podran usar: efectivo, Yape, Plin, tarjeta, transferencia o credito."
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
              <WalletCards className="h-6 w-6 text-[#00C70D]" />
            )}
          </div>
        }
        stats={[
          { label: "Metodos", value: String(methods.length), hint: "Formas de pago configuradas.", tone: "dark" },
          { label: "Activos", value: String(methods.filter((method) => method.enabled).length), hint: "Disponibles para vender.", tone: "accent" },
          { label: "Uso", value: "Caja y pedidos", hint: "Se seleccionan al registrar cobros." },
        ]}
      />

      {error ? <AdminMessage title="No pudimos guardar" description={error} tone="warn" /> : null}
      {success ? <AdminMessage title="Operacion completada" description={success} tone="accent" /> : null}

      {viewMode === "create" ? (
        <PanelCard title="Crear metodo de pago" description="Ejemplos recomendados para el piloto: efectivo, tarjeta, Yape, Plin y transferencia.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Codigo</span><input className={`${inputClass} lowercase`} placeholder="yape" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toLowerCase() }))} required /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nombre</span><input className={inputClass} placeholder="Yape" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Tipo</span><select className={inputClass} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PaymentMethodSummary["type"] }))}>{paymentTypes.map((type) => <option key={type} value={type}>{paymentTypeLabel(type)}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Orden</span><input type="number" className={inputClass} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
            <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Crear metodo</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Lista de metodos de pago" description="Esta lista alimenta caja, pedidos y cobros de ventas rapidas.">
          <AdminDataTable
            fetchData={fetchPaymentMethods}
            reloadKey={`${activeOrganizationId ?? ""}-${reloadKey}`}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar por metodo, codigo o tipo..."
            emptyTitle="Aun no hay metodos de pago"
            emptyDescription="Crea efectivo, tarjeta, Yape, Plin o transferencia para preparar caja."
            columns={[
              { key: "name", label: "Metodo", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.name}</p><p className="text-xs text-[#A1A1A1]">{row.code}</p></div> },
              { key: "type", label: "Tipo", render: (row) => paymentTypeLabel(row.type) },
              { key: "order", label: "Orden", align: "center", render: (row) => row.sortOrder },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.enabled ? "accent" : "soft"}>{row.enabled ? "Activo" : "Inactivo"}</Tag> },
            ]}
            actions={[
              { label: "Editar", permission: "cash.payment_methods.update", icon: <PencilIcon />, onClick: openMethodEditor },
              { label: "Activar", permission: "cash.payment_methods.activate", tone: "accent", icon: <PlusIcon />, visible: (row) => !row.enabled, onClick: toggleMethodStatus },
              { label: "Desactivar", permission: "cash.payment_methods.update", tone: "warn", icon: <CreditCard className="h-4 w-4" />, visible: (row) => row.enabled, onClick: toggleMethodStatus },
              { label: "Eliminar", permission: "cash.payment_methods.delete", tone: "warn", icon: <TrashIcon />, onClick: removeMethod },
            ]}
          />
        </PanelCard>
      )}

      <PanelCard title="Integraciones de pago" description="Izipay procesa cobros; Nubefact se configura por separado en Facturación. La API key se cifra en el servidor y jamás se expone al móvil.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={saveIzipay}>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Proveedor</span><input className={inputClass} value="Izipay" disabled /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Ambiente</span><select className={inputClass} value={izipayForm.environment} onChange={(event) => setIzipayForm((current) => ({ ...current, environment: event.target.value as "TEST" | "PRODUCTION" }))} disabled={!effectivePermissionKeys.includes("cash.payment_methods.update") || izipayBusy}><option value="TEST">Prueba</option><option value="PRODUCTION">Producción</option></select></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Código de comercio</span><input className={inputClass} value={izipayForm.merchantCode} onChange={(event) => setIzipayForm((current) => ({ ...current, merchantCode: event.target.value }))} placeholder="Entregado por Izipay" required disabled={!effectivePermissionKeys.includes("cash.payment_methods.update") || izipayBusy} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Código facilitador</span><input className={inputClass} value={izipayForm.facilitatorCode} onChange={(event) => setIzipayForm((current) => ({ ...current, facilitatorCode: event.target.value }))} placeholder="Opcional" disabled={!effectivePermissionKeys.includes("cash.payment_methods.update") || izipayBusy} /></label>
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#0D0D0D]">API key {izipay?.hasApiKey ? "(ya guardada)" : ""}</span><input className={inputClass} type="password" autoComplete="new-password" value={izipayForm.apiKey} onChange={(event) => setIzipayForm((current) => ({ ...current, apiKey: event.target.value }))} placeholder={izipay?.hasApiKey ? "Déjala vacía para conservarla" : "Clave de desarrollador Izipay"} disabled={!effectivePermissionKeys.includes("cash.payment_methods.update") || izipayBusy} /></label>
          <label className="flex items-center gap-3 rounded-[20px] border border-[#e6ebd9] bg-[#fafcf5] px-4 py-3 text-sm font-semibold md:col-span-2"><input type="checkbox" checked={izipayForm.enabled} onChange={(event) => setIzipayForm((current) => ({ ...current, enabled: event.target.checked }))} disabled={!effectivePermissionKeys.includes("cash.payment_methods.update") || izipayBusy} /> Activar Izipay cuando el bridge móvil esté instalado y validado</label>
          <div className="flex items-center justify-between gap-3 md:col-span-2"><p className="text-xs leading-5 text-[#535353]">Estado: {izipay?.enabled ? "activo" : "pendiente"}. Guardar estas credenciales no habilita aún el lector físico ni la impresora del SmartPOS.</p>{effectivePermissionKeys.includes("cash.payment_methods.update") ? <AdminActionButton type="submit" tone="primary" disabled={izipayBusy}>Guardar Izipay</AdminActionButton> : null}</div>
        </form>
      </PanelCard>

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
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Codigo</span><input className={`${inputClass} lowercase`} value={editForm.code} onChange={(event) => setEditForm((current) => ({ ...current, code: event.target.value.toLowerCase() }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nombre</span><input className={inputClass} value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Tipo</span><select className={inputClass} value={editForm.type} onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value as PaymentMethodSummary["type"] }))}>{paymentTypes.map((type) => <option key={type} value={type}>{paymentTypeLabel(type)}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Orden</span><input type="number" className={inputClass} value={editForm.sortOrder} onChange={(event) => setEditForm((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Estado</span><select className={inputClass} value={editForm.enabled ? "ACTIVE" : "INACTIVE"} onChange={(event) => setEditForm((current) => ({ ...current, enabled: event.target.value === "ACTIVE" }))}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></select></label>
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
