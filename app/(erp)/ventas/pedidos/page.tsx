"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bike, Clock3, Search, ShoppingBag, Utensils } from "lucide-react";
import { AdminActionButton, PlusIcon } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { getBranches, getOpenAccounts } from "../../../lib/erp-api";
import type { BranchSummary, OpenAccountSummary, ServiceType } from "../../../types/erp";

type Filter = "ALL" | ServiceType | "PARTIAL";

const filters: Array<{ key: Filter; label: string }> = [
  { key: "ALL", label: "Todos" },
  { key: "LOCAL", label: "Local" },
  { key: "DELIVERY", label: "Delivery" },
  { key: "TAKEAWAY", label: "Para llevar" },
  { key: "PARTIAL", label: "Parciales" },
];

export default function VentasPedidosPage() {
  const { accessToken, activeOrganizationId, refreshSession } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [branchId, setBranchId] = useState("");
  const [accounts, setAccounts] = useState<OpenAccountSummary[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadAccounts(nextBranchId = branchId, nextFilter = filter, nextSearch = search, options?: { silent?: boolean }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !nextBranchId) {
      if (!options?.silent) setLoading(false);
      return;
    }
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    if (!options?.silent) setLoading(true);
    try {
      const rows = await getOpenAccounts({
        accessToken: token,
        organizationId: activeOrganizationId,
        branchId: nextBranchId,
        status: nextFilter === "PARTIAL" ? "PARTIALLY_PAID" : undefined,
        serviceType: ["LOCAL", "DELIVERY", "TAKEAWAY"].includes(nextFilter)
          ? (nextFilter as ServiceType)
          : undefined,
        search: nextSearch,
      });
      if (requestId !== latestRequestRef.current) return;
      setAccounts(rows);
      setError(null);
    } catch (loadError) {
      if (requestId !== latestRequestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las cuentas.");
    } finally {
      if (requestId === latestRequestRef.current && !options?.silent) setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const token = await resolveToken();
      if (!token || !activeOrganizationId) return;
      try {
        const rows = await getBranches({ accessToken: token, organizationId: activeOrganizationId });
        if (!mounted) return;
        const active = rows.filter((branch) => branch.status === "ACTIVE");
        const nextBranchId = active[0]?.id ?? "";
        setBranches(active);
        setBranchId(nextBranchId);
        if (nextBranchId) await loadAccounts(nextBranchId);
        else setLoading(false);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "No se cargaron las sucursales.");
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  useEffect(() => {
    if (!branchId) return;
    const delay = window.setTimeout(() => void loadAccounts(), 250);
    return () => window.clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, filter, search]);

  useEffect(() => {
    if (!branchId) return;
    const timer = window.setInterval(() => void loadAccounts(branchId, filter, search, { silent: true }), 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, filter, search]);

  const total = accounts.reduce((sum, account) => sum + account.total, 0);
  const pending = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Ventas"
        title="Cuentas abiertas"
        description="Consulta pedidos de todos los canales. Los filtros y el buscador consultan directamente la información real de la sucursal."
        action={<div className="flex gap-3"><select className="rounded-full border border-[#dfe7cf] bg-white px-5 py-3 text-sm" value={branchId} onChange={(event) => setBranchId(event.target.value)}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><Link href="/ventas/pos"><AdminActionButton tone="primary" icon={<PlusIcon />}>Ir al POS</AdminActionButton></Link></div>}
        stats={[
          { label: "Cuentas visibles", value: String(accounts.length), hint: "Según filtro y búsqueda actual.", tone: "dark" },
          { label: "Consumo acumulado", value: `S/ ${total.toFixed(2)}`, hint: "Total de las cuentas mostradas.", tone: "accent" },
          { label: "Saldo pendiente", value: `S/ ${pending.toFixed(2)}`, hint: "Pendiente de cobro." },
        ]}
      />

      {error ? <AdminMessage title="No se pudieron consultar los pedidos" description={error} tone="warn" /> : null}

      <PanelCard title="Operación actual" description="Se actualiza automáticamente cada cinco segundos.">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === item.key ? "border-[#1a1d14] bg-[#171717] text-white" : "border-[#e1e7d3] bg-white text-[#566347]"}`}>{item.label}</button>)}</div>
          <label className="relative min-w-72"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7e896a]" /><input className="w-full rounded-full border border-[#dfe7cf] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#a9cf24]" placeholder="Mesa, cuenta, cliente o teléfono" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>

        {loading && accounts.length === 0 ? <p className="py-12 text-center text-sm text-[#70795f]">Actualizando cuentas...</p> : null}
        {!loading && accounts.length === 0 ? <div className="mt-6"><AdminMessage title="No encontramos cuentas" description="Prueba otro filtro o inicia un pedido desde el POS." /></div> : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const Icon = account.serviceType === "LOCAL" ? Utensils : account.serviceType === "DELIVERY" ? Bike : ShoppingBag;
            return <article key={account.id} className="rounded-[28px] border border-[#e5ead8] bg-white p-5 shadow-[0_16px_34px_rgba(34,44,18,0.05)]"><div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#eff7d1] text-[#4d6519]"><Icon className="h-5 w-5" /></span><Tag tone={account.status === "PARTIALLY_PAID" ? "warn" : "accent"}>{account.status === "PARTIALLY_PAID" ? "Pago parcial" : "Cuenta abierta"}</Tag></div><h3 className="mt-5 text-xl font-semibold text-[#1a210f]">{account.diningTable?.name ?? account.customerName ?? (account.serviceType === "TAKEAWAY" ? "Para llevar" : "Delivery")}</h3><p className="mt-1 text-xs text-[#747e62]">{account.accountNumber} · {account._count?.items ?? 0} ítems</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#f5f7f0] p-3"><p className="text-xs text-[#758064]">Total</p><strong className="mt-1 block">S/ {account.total.toFixed(2)}</strong></div><div className="rounded-2xl bg-[#fff7e9] p-3"><p className="text-xs text-[#806d4c]">Saldo</p><strong className="mt-1 block text-[#684d1d]">S/ {account.balance.toFixed(2)}</strong></div></div><p className="mt-4 flex items-center gap-2 text-xs text-[#768063]"><Clock3 className="h-4 w-4" />Actualizada {new Date(account.updatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p></article>;
          })}
        </div>
      </PanelCard>
    </section>
  );
}
