"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, PlugZap, Power, PowerOff, Settings2, Trash2 } from "lucide-react";
import { AdminActionButton } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import {
  activateBillingProvider,
  createBillingProvider,
  deleteBillingProvider,
  deactivateBillingProvider,
  getBillingProvider,
  testBillingProvider,
  updateBillingProvider,
} from "../../../lib/erp-api";
import type { BillingProviderConfigSummary } from "../../../types/erp";

const inputClass =
  "w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#00C70D]";

const emptyProvider: BillingProviderConfigSummary & { token: string } = {
  provider: "NUBEFACT_PSE",
  environment: "TEST",
  baseUrl: "",
  endpoint: "",
  authorizationScheme: "TOKEN",
  pdfFormat: "TICKET",
  enabled: false,
  hasToken: false,
  configured: false,
  updatedAt: null,
  token: "",
};

type ProviderFormMode = "create" | "edit";

export default function ProveedoresFiscalesPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [provider, setProvider] = useState(emptyProvider);
  const [providerForm, setProviderForm] = useState(emptyProvider);
  const [providerMode, setProviderMode] = useState<ProviderFormMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canCreateProvider = effectivePermissionKeys.includes("billing.providers.create");
  const canUpdateProvider = effectivePermissionKeys.includes("billing.providers.update");
  const canActivateProvider = effectivePermissionKeys.includes("billing.providers.activate");
  const canDeactivateProvider = effectivePermissionKeys.includes("billing.providers.deactivate");
  const canDeleteProvider = effectivePermissionKeys.includes("billing.providers.delete");

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadProvider() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      const providerConfig = await getBillingProvider({ accessToken: token, organizationId: activeOrganizationId });
      setProvider({ ...providerConfig, token: "" });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el proveedor fiscal.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProvider(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  function openCreateProvider() {
    setProviderForm({ ...emptyProvider, baseUrl: "https://api.pse.pe" });
    setProviderMode("create");
    setError(null);
  }

  function openEditProvider() {
    setProviderForm({ ...provider, token: "" });
    setProviderMode("edit");
    setError(null);
  }

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !providerMode) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        environment: providerForm.environment,
        baseUrl: providerForm.baseUrl,
        endpoint: providerForm.endpoint,
        authorizationScheme: providerForm.authorizationScheme,
        pdfFormat: providerForm.pdfFormat,
        enabled: providerForm.enabled,
        token: providerForm.token.trim() || undefined,
      };
      const saved =
        providerMode === "create"
          ? await createBillingProvider({ accessToken: token, organizationId: activeOrganizationId, body })
          : await updateBillingProvider({ accessToken: token, organizationId: activeOrganizationId, body });
      setProvider({ ...saved, token: "" });
      setProviderMode(null);
      setSuccess("Proveedor fiscal guardado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar el proveedor fiscal.");
    } finally {
      setBusy(false);
    }
  }

  async function runProviderAction(action: "test" | "activate" | "deactivate" | "delete") {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    if (action === "delete" && !window.confirm("¿Eliminar la conexión fiscal guardada?")) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (action === "test") {
        const result = await testBillingProvider({ accessToken: token, organizationId: activeOrganizationId });
        setSuccess(result.message);
      }
      if (action === "activate") {
        const saved = await activateBillingProvider({ accessToken: token, organizationId: activeOrganizationId });
        setProvider({ ...saved, token: "" });
        setSuccess("Emisión electrónica activada.");
      }
      if (action === "deactivate") {
        const saved = await deactivateBillingProvider({ accessToken: token, organizationId: activeOrganizationId });
        setProvider({ ...saved, token: "" });
        setSuccess("Emisión electrónica desactivada.");
      }
      if (action === "delete") {
        await deleteBillingProvider({ accessToken: token, organizationId: activeOrganizationId });
        setProvider(emptyProvider);
        setSuccess("Proveedor fiscal eliminado.");
      }
      await loadProvider();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  const providerStatus = provider.configured
    ? provider.enabled
      ? "Activo"
      : "Desactivado"
    : "Sin configurar";

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Finanzas"
        title="Proveedores fiscales"
        description="Administra la integración fiscal sin amarrar el ERP a un proveedor específico."
        action={!provider.configured && canCreateProvider ? <AdminActionButton tone="primary" icon={<Settings2 className="h-4 w-4" />} onClick={openCreateProvider}>Crear proveedor</AdminActionButton> : <PlugZap className="h-6 w-6 text-[#00C70D]" />}
        stats={[
          { label: "Estado", value: providerStatus, hint: "Controla si se puede emitir electrónicamente.", tone: provider.enabled ? "accent" : "dark" },
          { label: "Ambiente", value: provider.environment === "TEST" ? "Prueba" : "Producción", hint: "Separado de series y comprobantes." },
          { label: "Token", value: provider.hasToken ? "Guardado" : "Pendiente", hint: "El valor real nunca vuelve al navegador." },
        ]}
      />

      {error ? <AdminMessage title="No se pudo completar la operación" description={error} tone="warn" /> : null}
      {success ? <AdminMessage title="Operación completada" description={success} tone="accent" /> : null}

      <PanelCard
        title="Proveedor fiscal activo"
        description="Hoy puede ser Nubefact/PSE; mañana puede ser SUNAT directo o un servicio propio sin cambiar la arquitectura del módulo."
        action={<Tag tone={provider.enabled ? "accent" : "warn"}>{providerStatus}</Tag>}
      >
        <div className="rounded-[20px] border border-[#e6ebd9] bg-[#F8F8F8] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#839052]">Proveedor</p>
              <h3 className="mt-1 text-2xl font-semibold text-[#1c2511]">{provider.configured ? provider.provider : "Sin configurar"}</h3>
            </div>
            <Tag tone={provider.enabled ? "accent" : "warn"}>{providerStatus}</Tag>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-[#59634a]">
            <p><strong className="text-[#202914]">URL:</strong> {provider.baseUrl || "Pendiente"}</p>
            <p><strong className="text-[#202914]">Endpoint:</strong> {provider.endpoint || "Pendiente"}</p>
            <p><strong className="text-[#202914]">Autorización:</strong> {provider.authorizationScheme}</p>
            <p><strong className="text-[#202914]">PDF:</strong> {provider.pdfFormat}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {provider.configured && canUpdateProvider ? <AdminActionButton icon={<Pencil className="h-4 w-4" />} onClick={openEditProvider}>Editar</AdminActionButton> : null}
          {provider.configured ? <AdminActionButton tone="accent" icon={<PlugZap className="h-4 w-4" />} onClick={() => void runProviderAction("test")} disabled={busy || !provider.hasToken}>Probar</AdminActionButton> : null}
          {provider.configured && !provider.enabled && canActivateProvider ? <AdminActionButton tone="accent" icon={<Power className="h-4 w-4" />} onClick={() => void runProviderAction("activate")} disabled={busy}>Activar</AdminActionButton> : null}
          {provider.configured && provider.enabled && canDeactivateProvider ? <AdminActionButton icon={<PowerOff className="h-4 w-4" />} onClick={() => void runProviderAction("deactivate")} disabled={busy}>Desactivar</AdminActionButton> : null}
          {provider.configured && canDeleteProvider ? <AdminActionButton tone="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => void runProviderAction("delete")} disabled={busy}>Eliminar</AdminActionButton> : null}
        </div>
      </PanelCard>

      <AdminOverlayPanel
        open={Boolean(providerMode)}
        onClose={() => !busy && setProviderMode(null)}
        eyebrow="Proveedor fiscal"
        title={providerMode === "create" ? "Crear proveedor" : "Editar proveedor"}
        description="Estos datos pertenecen a la organización activa y se guardan cifrados cuando corresponde."
        footer={<div className="flex justify-end gap-3"><AdminActionButton onClick={() => setProviderMode(null)} disabled={busy}>Cancelar</AdminActionButton><AdminActionButton type="submit" form="billing-provider-form" tone="primary" icon={<Settings2 className="h-4 w-4" />} disabled={busy}>Guardar</AdminActionButton></div>}
      >
        <form id="billing-provider-form" className="space-y-4" onSubmit={submitProvider}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-semibold">Ambiente</span><select className={inputClass} value={providerForm.environment} onChange={(event) => setProviderForm((current) => ({ ...current, environment: event.target.value as "TEST" | "PRODUCTION" }))}><option value="TEST">Prueba</option><option value="PRODUCTION">Producción</option></select></label>
            <label className="space-y-2"><span className="text-sm font-semibold">Formato PDF</span><select className={inputClass} value={providerForm.pdfFormat} onChange={(event) => setProviderForm((current) => ({ ...current, pdfFormat: event.target.value as "TICKET" | "A4" }))}><option value="TICKET">Ticket</option><option value="A4">A4</option></select></label>
          </div>
          <label className="space-y-2"><span className="text-sm font-semibold">URL base</span><input className={inputClass} value={providerForm.baseUrl} onChange={(event) => setProviderForm((current) => ({ ...current, baseUrl: event.target.value }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold">Endpoint</span><input className={inputClass} placeholder="/api/v1/identificador" value={providerForm.endpoint} onChange={(event) => setProviderForm((current) => ({ ...current, endpoint: event.target.value }))} required /></label>
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <label className="space-y-2"><span className="text-sm font-semibold">Autorización</span><select className={inputClass} value={providerForm.authorizationScheme} onChange={(event) => setProviderForm((current) => ({ ...current, authorizationScheme: event.target.value as "BEARER" | "RAW" | "TOKEN" }))}><option value="TOKEN">Token token=</option><option value="BEARER">Bearer</option><option value="RAW">Token directo</option></select></label>
            <label className="space-y-2"><span className="text-sm font-semibold">Token {providerForm.hasToken ? "(ya guardado)" : ""}</span><input className={inputClass} type="password" autoComplete="new-password" placeholder={providerForm.hasToken ? "Déjalo vacío para conservarlo" : "Token del ambiente"} value={providerForm.token} onChange={(event) => setProviderForm((current) => ({ ...current, token: event.target.value }))} /></label>
          </div>
          <label className="flex items-center gap-3 rounded-[20px] border border-[#e6ebd9] bg-[#fafcf5] px-4 py-3 text-sm font-semibold"><input type="checkbox" checked={providerForm.enabled} onChange={(event) => setProviderForm((current) => ({ ...current, enabled: event.target.checked }))} /> Guardar activo</label>
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
