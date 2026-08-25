"use client";

import { useState } from "react";
import { AdminActionButton, ArrowLeftIcon, PlusIcon } from "../../../components/admin/AdminActionButton";
import { AdminDataTable, createLocalAdminTableFetch } from "../../../components/admin/AdminDataTable";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import {
  createCashMovement,
  getCashMovements,
  getCashSessions,
  getPaymentMethods,
} from "../../../lib/erp-api";
import type {
  CashMovementSummary,
  CashMovementType,
  CashSessionSummary,
  PaymentMethodSummary,
} from "../../../types/erp";

const movementTypes: Array<{ value: CashMovementType; label: string }> = [
  { value: "INCOME", label: "Ingreso" },
  { value: "EXPENSE", label: "Gasto" },
  { value: "WITHDRAWAL", label: "Retiro" },
  { value: "DEPOSIT", label: "Deposito" },
  { value: "ADJUSTMENT", label: "Ajuste" },
];

export default function CajaMovimientosPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [openSessions, setOpenSessions] = useState<CashSessionSummary[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([]);
  const [movements, setMovements] = useState<CashMovementSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "INCOME" as CashMovementType,
    amount: "0",
    concept: "",
    paymentMethodId: "",
    note: "",
  });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadBaseData() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const [sessionResponse, methods] = await Promise.all([
      getCashSessions({
        accessToken: token,
        organizationId: activeOrganizationId,
        page: 1,
        limit: 100,
        status: "OPEN",
      }),
      getPaymentMethods({ accessToken: token, organizationId: activeOrganizationId }),
    ]);
    setOpenSessions(sessionResponse.data);
    setPaymentMethods(methods.filter((method) => method.enabled));

    const nextSessionId = selectedSessionId || sessionResponse.data[0]?.id || "";
    if (nextSessionId !== selectedSessionId) {
      setSelectedSessionId(nextSessionId);
    }

    return { token, sessionId: nextSessionId };
  }

  async function fetchMovements(input: { page: number; limit: number; search: string }) {
    const { token, sessionId } = await loadBaseData();
    if (!sessionId || !activeOrganizationId) {
      setMovements([]);
      return { data: [], total: 0 };
    }
    const rows = await getCashMovements({
      accessToken: token,
      organizationId: activeOrganizationId,
      cashSessionId: sessionId,
    });
    setMovements(rows);
    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (movement, search) =>
        [movement.concept, movement.note, movement.type, movement.paymentMethod?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedSessionId) return;
    setError(null);
    try {
      await createCashMovement({
        accessToken: token,
        organizationId: activeOrganizationId,
        cashSessionId: selectedSessionId,
        body: {
          type: form.type,
          amount: Number(form.amount || "0"),
          concept: form.concept,
          paymentMethodId: form.paymentMethodId || undefined,
          note: form.note,
        },
      });
      setForm({
        type: "INCOME",
        amount: "0",
        concept: "",
        paymentMethodId: "",
        note: "",
      });
      setViewMode("table");
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo registrar el movimiento.");
    }
  }

  const selectedSession = openSessions.find((session) => session.id === selectedSessionId);
  const incomeTotal = movements
    .filter((movement) => ["INCOME", "DEPOSIT", "ADJUSTMENT"].includes(movement.type))
    .reduce((total, movement) => total + movement.amount, 0);
  const expenseTotal = movements
    .filter((movement) => ["EXPENSE", "WITHDRAWAL"].includes(movement.type))
    .reduce((total, movement) => total + Math.abs(movement.amount), 0);

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Caja"
        title="Movimientos"
        description="Registra ingresos, gastos, retiros y ajustes dentro de una caja abierta."
        action={
          <div className="flex gap-2">
            {viewMode === "create" ? (
              <AdminActionButton tone="ghost" icon={<ArrowLeftIcon />} onClick={() => setViewMode("table")}>
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton onClick={() => setViewMode("create")} icon={<PlusIcon />} tone="primary" active={viewMode === "create"}>
              Nuevo movimiento
            </AdminActionButton>
          </div>
        }
        stats={[
          { label: "Sesiones abiertas", value: String(openSessions.length), hint: "Cajas operativas.", tone: "dark" },
          { label: "Ingresos manuales", value: `S/ ${incomeTotal.toFixed(2)}`, hint: "Ingresos, depositos y ajustes.", tone: "accent" },
          { label: "Salidas", value: `S/ ${expenseTotal.toFixed(2)}`, hint: "Gastos y retiros." },
        ]}
      />
      {error ? <AdminMessage title="No pudimos registrar el movimiento" description={error} tone="warn" /> : null}
      {viewMode === "create" ? (
        <PanelCard title="Nuevo movimiento" description="Todo movimiento queda ligado a la sesion abierta.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Caja abierta</span>
              <select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)} required>
                <option value="">No hay caja abierta</option>
                {openSessions.map((session) => <option key={session.id} value={session.id}>{session.cashRegister?.name} - {session.branch?.name}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Tipo</span>
              <select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CashMovementType }))}>
                {movementTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Monto</span><input type="number" step="0.01" className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Concepto</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" placeholder="Compra menor, retiro, ingreso extra..." value={form.concept} onChange={(event) => setForm((current) => ({ ...current, concept: event.target.value }))} required /></label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Metodo de pago</span>
              <select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.paymentMethodId} onChange={(event) => setForm((current) => ({ ...current, paymentMethodId: event.target.value }))}>
                <option value="">Sin metodo</option>
                {paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
              </select>
            </label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nota</span><textarea className="min-h-24 w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
            <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />} disabled={!selectedSession}>Registrar movimiento</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Movimientos de la caja" description="Historial manual de la sesion seleccionada.">
          <AdminDataTable
            fetchData={fetchMovements}
            reloadKey={`${activeOrganizationId ?? ""}-${selectedSessionId}-${reloadKey}`}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar movimiento..."
            emptyTitle={selectedSession ? "Aun no hay movimientos" : "No hay caja abierta"}
            emptyDescription={selectedSession ? "Registra el primer ingreso, gasto o retiro." : "Abre una caja para registrar movimientos."}
            columns={[
              { key: "concept", label: "Concepto", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.concept}</p><p className="text-xs text-[#A1A1A1]">{row.paymentMethod?.name ?? "sin metodo"}</p></div> },
              { key: "type", label: "Tipo", render: (row) => <Tag tone={["EXPENSE", "WITHDRAWAL"].includes(row.type) ? "warn" : "accent"}>{row.type}</Tag> },
              { key: "amount", label: "Monto", align: "right", render: (row) => `S/ ${row.amount.toFixed(2)}` },
              { key: "date", label: "Fecha", render: (row) => new Date(row.occurredAt).toLocaleString("es-PE") },
            ]}
          />
        </PanelCard>
      )}
    </section>
  );
}
