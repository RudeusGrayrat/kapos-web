"use client";

import { useEffect, useState } from "react";
import { LineChart, TrendingUp } from "lucide-react";
import { AdminModuleHeader, AdminMessage, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { getProfitability } from "../../../lib/erp-api";
import type { DashboardRange, ProfitabilitySummary } from "../../../types/erp";

const rangeLabels: Record<DashboardRange, string> = {
  today: "Hoy",
  last_7_days: "Ultimos 7 dias",
  last_30_days: "Ultimos 30 dias",
};

function money(value: number) {
  return `S/ ${value.toFixed(2)}`;
}

export default function RentabilidadPage() {
  const { accessToken, activeOrganizationId, refreshSession } = useAuth();
  const [range, setRange] = useState<DashboardRange>("last_30_days");
  const [summary, setSummary] = useState<ProfitabilitySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const token = await resolveToken();
      if (!token || !activeOrganizationId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getProfitability({ accessToken: token, organizationId: activeOrganizationId, range });
        if (mounted) setSummary(result);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "No se pudo calcular rentabilidad.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId, range]);

  const maxDaily = Math.max(1, ...(summary?.daily ?? []).map((day) => Math.max(day.sales, day.expenses, Math.abs(day.profit))));

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Finanzas"
        title="Rentabilidad"
        description="Margen con costos congelados al vender y gastos reales registrados en caja."
        action={<select className="rounded-full border border-[#E4E4E4] bg-white px-5 py-3 text-sm font-semibold" value={range} onChange={(event) => setRange(event.target.value as DashboardRange)}>{Object.entries(rangeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>}
        stats={[
          { label: "Venta", value: money(summary?.summary.salesTotal ?? 0), hint: `${summary?.summary.saleCount ?? 0} ventas`, tone: "dark" },
          { label: "Costo productos", value: money(summary?.summary.productCostTotal ?? 0), hint: "Costo histórico de cada venta.", tone: "accent" },
          { label: "Utilidad neta", value: money(summary?.summary.netProfit ?? 0), hint: `${(summary?.summary.marginPercent ?? 0).toFixed(1)}% margen.` },
        ]}
      />

      {error ? <AdminMessage title="No pudimos calcular" description={error} tone="warn" /> : null}
      {loading ? <PanelCard title="Calculando" description="Cargando ventas, costos y gastos..."><p className="text-sm text-[#535353]">Preparando resumen financiero.</p></PanelCard> : null}

      {summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <PanelCard title="Ventas" description="Ingresos cobrados"><strong className="text-3xl">{money(summary.summary.salesTotal)}</strong></PanelCard>
            <PanelCard title="Costos" description="Costo estimado de productos"><strong className="text-3xl">{money(summary.summary.productCostTotal)}</strong></PanelCard>
            <PanelCard title="Gastos" description={`${summary.summary.expenseCount} movimientos`}><strong className="text-3xl">{money(summary.summary.expenseTotal)}</strong></PanelCard>
            <PanelCard title="Margen neto" description="Despues de costos y gastos"><strong className="text-3xl">{summary.summary.marginPercent.toFixed(1)}%</strong></PanelCard>
          </div>

          <PanelCard title="Evolución" description="Ventas, gastos y utilidad neta por día." action={<LineChart className="h-5 w-5 text-[#00C70D]" />}>
            <div className="grid min-h-80 items-end gap-3 md:grid-cols-7 lg:grid-cols-10">
              {summary.daily.map((day) => (
                <div key={day.date} className="flex min-h-72 flex-col justify-end gap-2">
                  <div className="flex h-52 items-end gap-1 rounded-[20px] bg-[#F8F8F8] px-2 py-3">
                    <span className="block w-full rounded-full bg-[#00C70D]" style={{ height: `${Math.max(4, (day.sales / maxDaily) * 100)}%` }} />
                    <span className="block w-full rounded-full bg-[#A1A1A1]" style={{ height: `${Math.max(4, (day.expenses / maxDaily) * 100)}%` }} />
                    <span className={`block w-full rounded-full ${day.profit >= 0 ? "bg-[#0D0D0D]" : "bg-[#d35b39]"}`} style={{ height: `${Math.max(4, (Math.abs(day.profit) / maxDaily) * 100)}%` }} />
                  </div>
                  <p className="truncate text-center text-xs text-[#535353]">{new Date(`${day.date}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#535353]">
              <Tag tone="accent">Ventas</Tag>
              <Tag tone="soft">Gastos</Tag>
              <Tag tone="dark">Utilidad</Tag>
            </div>
          </PanelCard>

          <PanelCard title="Productos que sostienen el margen" description="Ranking estimado por utilidad bruta." action={<TrendingUp className="h-5 w-5 text-[#00C70D]" />}>
            <div className="space-y-3">
              {summary.topProducts.length === 0 ? <p className="py-10 text-center text-sm text-[#535353]">Sin ventas en el rango.</p> : null}
              {summary.topProducts.map((product, index) => (
                <div key={product.name} className="grid gap-3 rounded-[22px] border border-[#E4E4E4] bg-white p-4 md:grid-cols-[40px_minmax(0,1fr)_120px_120px_120px]">
                  <strong className="grid h-10 w-10 place-items-center rounded-full bg-[#E8FCEB] text-[#00A70B]">{index + 1}</strong>
                  <div><p className="font-black text-[#0D0D0D]">{product.name}</p><p className="text-xs text-[#535353]">{product.quantity.toFixed(2)} unidades</p></div>
                  <p className="text-sm"><span className="block text-xs text-[#A1A1A1]">Venta</span>{money(product.sales)}</p>
                  <p className="text-sm"><span className="block text-xs text-[#A1A1A1]">Costo</span>{money(product.cost)}</p>
                  <p className="text-sm font-black text-[#00A70B]"><span className="block text-xs text-[#A1A1A1]">Margen</span>{money(product.profit)}</p>
                </div>
              ))}
            </div>
          </PanelCard>
        </>
      ) : null}
    </section>
  );
}
