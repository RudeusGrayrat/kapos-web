"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { AdminActionButton } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { createRecurringExpense, deleteRecurringExpense, getBranches, getFinancialPlanning, upsertFinancialPlan } from "../../../lib/erp-api";
import type { BranchSummary, FinancialPlanningSummary } from "../../../types/erp";

const inputClass = "w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#00C70D]";
const money = (value: number) => `S/ ${value.toFixed(2)}`;

export default function PlanificacionFinancieraPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [branchId, setBranchId] = useState("");
  const [data, setData] = useState<FinancialPlanningSummary | null>(null);
  const [target, setTarget] = useState("0");
  const [dailyTarget, setDailyTarget] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManage = effectivePermissionKeys.includes("finance.planning.manage");

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function load(selectedBranchId = branchId) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedBranchId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getFinancialPlanning({ accessToken: token, organizationId: activeOrganizationId, branchId: selectedBranchId });
      setData(result);
      setTarget(String(result.plan?.monthlySalesTarget ?? result.summary.recommendedMonthlySalesTarget));
      setDailyTarget(result.plan?.dailyConsumptionTarget ? String(result.plan.dailyConsumptionTarget) : "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la planificación.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      const token = await resolveToken();
      if (!token || !activeOrganizationId) return;
      try {
        const result = await getBranches({ accessToken: token, organizationId: activeOrganizationId });
        const active = result.filter((branch) => branch.status === "ACTIVE");
        setBranches(active);
        const firstBranchId = active[0]?.id ?? "";
        setBranchId(firstBranchId);
        if (firstBranchId) await load(firstBranchId);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las sucursales.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !branchId) return;
    setBusy(true);
    try {
      await upsertFinancialPlan({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: { branchId, monthlySalesTarget: Number(target || 0), dailyConsumptionTarget: dailyTarget ? Number(dailyTarget) : undefined },
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar la meta.");
    } finally { setBusy(false); }
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !branchId) return;
    setBusy(true);
    try {
      await createRecurringExpense({
        accessToken: token, organizationId: activeOrganizationId,
        body: { branchId, name: expenseName, amount: Number(expenseAmount), startsOn: new Date().toISOString().slice(0, 10) },
      });
      setExpenseName(""); setExpenseAmount(""); await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo agregar el gasto recurrente.");
    } finally { setBusy(false); }
  }

  async function removeExpense(expenseId: string) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !window.confirm("¿Eliminar este gasto recurrente?")) return;
    setBusy(true);
    try {
      await deleteRecurringExpense({ accessToken: token, organizationId: activeOrganizationId, expenseId });
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "No se pudo eliminar el gasto.");
    } finally { setBusy(false); }
  }

  const summary = data?.summary;
  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Finanzas"
        title="Planificación financiera"
        description="Define gastos fijos y metas por sucursal. La meta sugerida cubre gastos recurrentes según el margen histórico real."
        action={<select className="rounded-full border border-[#E4E4E4] bg-white px-5 py-3 text-sm font-semibold" value={branchId} onChange={(event) => { setBranchId(event.target.value); void load(event.target.value); }}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>}
        stats={[
          { label: "Gastos fijos", value: money(summary?.recurringExpenseTotal ?? 0), hint: "Presupuesto mensual activo.", tone: "dark" },
          { label: "Meta sugerida", value: money(summary?.recommendedMonthlySalesTarget ?? 0), hint: "Calculada por margen de contribución.", tone: "accent" },
          { label: "Avance", value: `${(summary?.targetProgressPercent ?? 0).toFixed(1)}%`, hint: summary?.isBelowExpectedPace ? "Por debajo del ritmo esperado." : "Al ritmo esperado.", tone: "dark" },
        ]}
      />
      {error ? <AdminMessage title="No se pudo completar la operación" description={error} tone="warn" /> : null}
      {loading ? <PanelCard title="Cargando planificación" description="Calculando ventas, costos y metas."><p className="text-sm text-[#535353]">Preparando el resumen financiero.</p></PanelCard> : null}
      {data ? <>
        <div className="grid gap-4 md:grid-cols-3">
          <PanelCard title="Ventas del mes" description="Ventas cobradas en esta sucursal."><strong className="text-3xl">{money(summary?.salesTotal ?? 0)}</strong></PanelCard>
          <PanelCard title="Costo variable" description="Costo histórico de productos vendidos."><strong className="text-3xl">{money(summary?.productCostTotal ?? 0)}</strong></PanelCard>
          <PanelCard title="Margen de contribución" description={`${summary?.consumptionCount.toFixed(0) ?? 0} consumos registrados.`}><strong className="text-3xl">{(summary?.contributionMarginPercent ?? 0).toFixed(1)}%</strong></PanelCard>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <PanelCard title="Metas y ritmo" description={`Al día de hoy deberías llevar ${money(summary?.expectedSalesToDate ?? 0)} para cumplir la meta mensual.`} action={<Target className="h-5 w-5 text-[#00C70D]" />}>
            <form className="space-y-4" onSubmit={savePlan}>
              <label className="block space-y-2"><span className="text-sm font-semibold">Meta mensual de ventas</span><input className={inputClass} type="number" min="0" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} disabled={!canManage || busy} /></label>
              <label className="block space-y-2"><span className="text-sm font-semibold">Meta diaria de consumos</span><input className={inputClass} type="number" min="0" step="1" value={dailyTarget} onChange={(event) => setDailyTarget(event.target.value)} placeholder="Ej. 30" disabled={!canManage || busy} /></label>
              {canManage ? <AdminActionButton type="submit" tone="primary" disabled={busy}>Guardar metas</AdminActionButton> : null}
            </form>
          </PanelCard>
          <PanelCard title="Gastos fijos mensuales" description="Planificados; no reemplazan los gastos reales registrados desde Caja.">
            <div className="space-y-3">{data.recurringExpenses.map((expense) => <div key={expense.id} className="flex items-center justify-between rounded-[18px] border border-[#E4E4E4] p-4"><div><strong>{expense.name}</strong><p className="text-xs text-[#535353]">Mensual · desde {new Date(`${expense.startsOn.slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE")}</p></div><div className="flex items-center gap-3"><Tag tone="dark">{money(expense.amount)}</Tag>{canManage ? <button type="button" aria-label={`Eliminar ${expense.name}`} onClick={() => void removeExpense(expense.id)} disabled={busy} className="text-[#C43D28]"><Trash2 className="h-4 w-4" /></button> : null}</div></div>)}</div>
            {canManage ? <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px_auto]" onSubmit={addExpense}><input className={inputClass} placeholder="Ej. Agua" value={expenseName} onChange={(event) => setExpenseName(event.target.value)} required disabled={busy} /><input className={inputClass} placeholder="S/ 60" type="number" min="0.01" step="0.01" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} required disabled={busy} /><AdminActionButton type="submit" icon={<Plus className="h-4 w-4" />} tone="primary" disabled={busy}>Agregar</AdminActionButton></form> : null}
          </PanelCard>
        </div>
      </> : null}
    </section>
  );
}
