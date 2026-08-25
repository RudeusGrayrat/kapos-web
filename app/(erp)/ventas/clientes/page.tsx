"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Mail, Search, Sparkles, UserRound } from "lucide-react";
import { AdminActionButton, PlusIcon } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { createCustomer, getCustomers } from "../../../lib/erp-api";
import type { CustomerSummary } from "../../../types/erp";

const inputClass =
  "w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#00C70D]";

const emptyForm = {
  firstName: "",
  lastName: "",
  documentType: "DNI" as "DNI" | "RUC" | "CE" | "PASSPORT",
  documentNumber: "",
  phone: "",
  email: "",
  externalCustomerCode: "",
};

export default function ClientesPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCreate = effectivePermissionKeys.includes("sales.customers.create");

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadCustomers(nextSearch = search) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    try {
      const response = await getCustomers({
        accessToken: token,
        organizationId: activeOrganizationId,
        page: 1,
        limit: 100,
        search: nextSearch,
      });
      setCustomers(response.data);
      setTotal(response.total);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los clientes.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCustomers(), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId, search]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setBusy(true);
    setError(null);
    try {
      await createCustomer({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          documentType: form.documentNumber ? form.documentType : undefined,
          documentNumber: form.documentNumber || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          externalCustomerCode: form.externalCustomerCode || undefined,
        },
      });
      setForm(emptyForm);
      setShowCreate(false);
      await loadCustomers("");
      setSearch("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo registrar el cliente.");
    } finally {
      setBusy(false);
    }
  }

  const totalPoints = customers.reduce((sum, customer) => sum + (customer.loyaltyWallet?.redeemablePoints ?? 0), 0);
  const identified = customers.filter((customer) => customer.user.documentNumber || customer.user.email).length;

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Ventas y fidelización"
        title="Clientes"
        description="Registra compradores desde caja para asociar sus ventas y conservar sus puntos, aunque todavía no tengan instalada la app."
        action={canCreate ? <AdminActionButton tone="primary" icon={<PlusIcon />} onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Ver clientes" : "Registrar cliente"}</AdminActionButton> : undefined}
        stats={[
          { label: "Clientes registrados", value: String(total), hint: "Perfiles de la organización.", tone: "dark" },
          { label: "Puntos visibles", value: String(totalPoints), hint: "Saldo de los resultados mostrados.", tone: "accent" },
          { label: "Identificados", value: String(identified), hint: "Con documento o correo registrado." },
        ]}
      />

      {error ? <AdminMessage title="No pudimos completar la operación" description={error} tone="warn" /> : null}

      {showCreate ? (
        <PanelCard title="Registro manual" description="Se requiere al menos teléfono, documento o correo para evitar perfiles imposibles de recuperar.">
          <form className="space-y-5" onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Nombres</span><input className={inputClass} value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} /></label><label className="space-y-2"><span className="text-sm font-semibold">Apellidos</span><input className={inputClass} value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} /></label></div>
            <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]"><label className="space-y-2"><span className="text-sm font-semibold">Documento</span><select className={inputClass} value={form.documentType} onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value as typeof form.documentType }))}><option value="DNI">DNI</option><option value="RUC">RUC</option><option value="CE">CE</option><option value="PASSPORT">Pasaporte</option></select></label><label className="space-y-2"><span className="text-sm font-semibold">Número</span><input className={inputClass} value={form.documentNumber} onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))} /></label></div>
            <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Teléfono</span><input className={inputClass} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label><label className="space-y-2"><span className="text-sm font-semibold">Correo</span><input className={inputClass} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label></div>
            <label className="space-y-2"><span className="text-sm font-semibold">Código externo (opcional)</span><input className={inputClass} placeholder="CLI-0001" value={form.externalCustomerCode} onChange={(event) => setForm((current) => ({ ...current, externalCustomerCode: event.target.value }))} /></label>
            <label className="flex cursor-not-allowed items-start gap-3 rounded-[22px] border border-[#e6eadc] bg-[#f7f8f3] p-4 opacity-65"><input className="mt-1" type="checkbox" disabled /><span><strong className="flex items-center gap-2 text-sm text-[#3c4631]"><Mail className="h-4 w-4" />Enviar invitación por correo</strong><small className="mt-1 block leading-6 text-[#77806a]">Próximamente: enviará confirmación, acceso y enlace de descarga de la app.</small></span></label>
            <div className="flex justify-end gap-3"><AdminActionButton tone="ghost" onClick={() => setShowCreate(false)}>Cancelar</AdminActionButton><AdminActionButton type="submit" tone="primary" disabled={busy}>Guardar cliente</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Directorio de clientes" description="Busca por nombre, documento, correo, teléfono o código.">
          <label className="relative block"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1A1]" /><input className="w-full rounded-full border border-[#E4E4E4] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#00C70D]" placeholder="Buscar cliente" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          {customers.length === 0 ? <div className="mt-6"><AdminMessage title="No encontramos clientes" description="Registra el primero para comenzar a asociar ventas y puntos." /></div> : null}
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer) => {
              const name = [customer.user.firstName, customer.user.lastName].filter(Boolean).join(" ") || customer.user.email || customer.user.phone || "Cliente sin nombre";
              return <article key={customer.id} className="rounded-[28px] border border-[#E4E4E4] bg-white p-5"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#E8FCEB] text-[#00C70D]"><UserRound className="h-5 w-5" /></span><Tag tone="accent">Activo</Tag></div><h3 className="mt-4 text-lg font-semibold text-[#1a210f]">{name}</h3><p className="mt-1 text-xs text-[#A1A1A1]">{customer.user.documentNumber ?? customer.externalCustomerCode ?? "Sin código"}</p><div className="mt-5 flex items-center justify-between rounded-2xl bg-[#E8FCEB] p-3"><span className="flex items-center gap-2 text-sm text-[#65714d]"><Sparkles className="h-4 w-4" />Puntos</span><strong className="text-[#00C70D]">{customer.loyaltyWallet?.redeemablePoints ?? 0}</strong></div><div className="mt-4 space-y-1 text-xs text-[#535353]"><p>{customer.user.phone ?? "Sin teléfono"}</p><p>{customer.user.email ?? "Sin correo"}</p></div>{customer.user.email ? <p className="mt-4 flex items-center gap-2 text-xs text-[#00C70D]"><CheckCircle2 className="h-4 w-4" />Preparado para invitación futura</p> : null}</article>;
            })}
          </div>
        </PanelCard>
      )}
    </section>
  );
}
