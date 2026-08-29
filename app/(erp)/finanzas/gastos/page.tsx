"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Banknote, Plus } from "lucide-react";
import { AdminActionButton } from "../../../components/admin/AdminActionButton";
import { AdminDataTable } from "../../../components/admin/AdminDataTable";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { useToast } from "../../../context/toast-context";
import { createExpense, getCashSessions, getExpenses, getPaymentMethods } from "../../../lib/erp-api";
import type { CashSessionSummary, ExpenseSummary, PaymentMethodSummary } from "../../../types/erp";

const inputClass =
  "w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]";

export default function GastosPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const toast = useToast();
  const [openSessions, setOpenSessions] = useState<CashSessionSummary[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    cashSessionId: "",
    paymentMethodId: "",
    amount: "0",
    concept: "",
    note: "",
  });

  const canCreate = effectivePermissionKeys.includes("finance.expenses.create");

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadOptions() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    const [sessions, methods] = await Promise.all([
      getCashSessions({ accessToken: token, organizationId: activeOrganizationId, page: 1, limit: 100, status: "OPEN" }),
      getPaymentMethods({ accessToken: token, organizationId: activeOrganizationId }),
    ]);
    setOpenSessions(sessions.data);
    setPaymentMethods(methods.filter((method) => method.enabled));
    setForm((current) => ({
      ...current,
      cashSessionId: current.cashSessionId || sessions.data[0]?.id || "",
      paymentMethodId: current.paymentMethodId || methods.find((method) => method.enabled)?.id || "",
    }));
  }

  async function fetchExpenses(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    void loadOptions();
    const result = await getExpenses({
      accessToken: token,
      organizationId: activeOrganizationId,
      page: input.page,
      limit: input.limit,
      search: input.search,
    });
    setExpenseTotal(result.data.reduce((total, expense) => total + expense.amount, 0));
    return result;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await createExpense({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          cashSessionId: form.cashSessionId,
          paymentMethodId: form.paymentMethodId || undefined,
          amount: Number(form.amount || "0"),
          concept: form.concept,
          note: form.note || undefined,
        },
      });
      setForm({ cashSessionId: openSessions[0]?.id || "", paymentMethodId: paymentMethods[0]?.id || "", amount: "0", concept: "", note: "" });
      setReloadVersion((current) => current + 1);
      setViewMode("table");
      toast.showSuccess("El gasto fue registrado correctamente.", "Gasto registrado");
    } catch (submitError) {
      toast.showError(submitError, "No se pudo registrar");
    }
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Finanzas"
        title="Gastos"
        description="Registra salidas reales de caja como compras, servicios, movilidad, mantenimiento o mermas con costo."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? <AdminActionButton icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setViewMode("table")}>Volver</AdminActionButton> : null}
            {canCreate ? <AdminActionButton tone="primary" icon={<Plus className="h-4 w-4" />} active={viewMode === "create"} onClick={() => { setViewMode("create"); void loadOptions(); }}>Registrar gasto</AdminActionButton> : <Banknote className="h-6 w-6 text-[#00C70D]" />}
          </div>
        }
        stats={[
          { label: "Gastos visibles", value: `S/ ${expenseTotal.toFixed(2)}`, hint: "Suma de la pagina actual.", tone: "dark" },
          { label: "Cajas abiertas", value: String(openSessions.length), hint: "Necesarias para registrar.", tone: "accent" },
          { label: "Uso", value: "Rentabilidad", hint: "Estos gastos alimentan margen neto." },
        ]}
      />

      {error ? <AdminMessage title="No pudimos cargar gastos" description={error} tone="warn" /> : null}

      {viewMode === "create" ? (
        <PanelCard title="Registrar gasto" description="El gasto se guarda como movimiento de caja y descuenta del cierre esperado.">
          {openSessions.length === 0 ? <AdminMessage title="No hay caja abierta" description="Abre una caja antes de registrar gastos operativos." tone="warn" /> : null}
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-2"><span className="text-sm font-semibold">Caja abierta</span><select className={inputClass} value={form.cashSessionId} onChange={(event) => setForm((current) => ({ ...current, cashSessionId: event.target.value }))} required><option value="">Selecciona caja</option>{openSessions.map((session) => <option key={session.id} value={session.id}>{session.branch?.name ?? "Sucursal"} · {session.cashRegister?.name ?? "Caja"}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold">Metodo</span><select className={inputClass} value={form.paymentMethodId} onChange={(event) => setForm((current) => ({ ...current, paymentMethodId: event.target.value }))}><option value="">Sin metodo</option>{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold">Concepto</span><input className={inputClass} placeholder="Luz, agua, compra urgente..." value={form.concept} onChange={(event) => setForm((current) => ({ ...current, concept: event.target.value }))} required /></label>
            <label className="space-y-2"><span className="text-sm font-semibold">Monto</span><input type="number" min="0.01" step="0.01" className={inputClass} value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required /></label>
            <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold">Nota</span><textarea className={inputClass} placeholder="Detalle interno opcional" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
            <div className="flex justify-end md:col-span-2"><AdminActionButton type="submit" tone="primary" disabled={!form.cashSessionId}>Guardar gasto</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Historial de gastos" description="Gastos reales registrados desde caja.">
          <AdminDataTable<ExpenseSummary>
            fetchData={fetchExpenses}
            reloadKey={`${activeOrganizationId ?? "none"}:${reloadVersion}`}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar concepto, metodo o sucursal..."
            emptyTitle="No hay gastos"
            emptyDescription="Registra gastos operativos para alimentar rentabilidad."
            columns={[
              { key: "date", label: "Fecha", render: (row) => new Date(row.occurredAt).toLocaleString("es-PE") },
              { key: "concept", label: "Concepto", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.concept}</p><p className="text-xs text-[#A1A1A1]">{row.note ?? "Sin nota"}</p></div> },
              { key: "cash", label: "Caja", render: (row) => `${row.cashSession?.branch.name ?? "Sucursal"} · ${row.cashSession?.cashRegister.name ?? "Caja"}` },
              { key: "method", label: "Metodo", render: (row) => row.paymentMethod?.name ?? "-" },
              { key: "amount", label: "Monto", align: "right", render: (row) => <strong>S/ {row.amount.toFixed(2)}</strong> },
              { key: "status", label: "Tipo", render: () => <Tag tone="warn">Gasto</Tag> },
            ]}
          />
        </PanelCard>
      )}
    </section>
  );
}
