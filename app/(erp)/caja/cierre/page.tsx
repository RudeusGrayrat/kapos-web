"use client";

import { useState } from "react";
import { AdminActionButton, ArrowLeftIcon, PlusIcon } from "../../../components/admin/AdminActionButton";
import { AdminDataTable } from "../../../components/admin/AdminDataTable";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { closeCashSession, getCashSessions } from "../../../lib/erp-api";
import type { CashSessionSummary } from "../../../types/erp";

function calculateExpected(session: CashSessionSummary | undefined) {
  if (!session) return 0;
  return session.movements.reduce((total, movement) => {
    if (movement.type === "EXPENSE" || movement.type === "WITHDRAWAL") {
      return total - Math.abs(movement.amount);
    }
    return total + movement.amount;
  }, session.openingAmount);
}

export default function CajaCierrePage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [openSessions, setOpenSessions] = useState<CashSessionSummary[]>([]);
  const [closedSessions, setClosedSessions] = useState<CashSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "close">("table");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ countedAmount: "0", closingNote: "" });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function fetchClosedSessions(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const [openResponse, closedResponse] = await Promise.all([
      getCashSessions({
        accessToken: token,
        organizationId: activeOrganizationId,
        page: 1,
        limit: 100,
        status: "OPEN",
      }),
      getCashSessions({
        accessToken: token,
        organizationId: activeOrganizationId,
        page: input.page,
        limit: input.limit,
        search: input.search,
        status: "CLOSED",
      }),
    ]);
    setOpenSessions(openResponse.data);
    setClosedSessions(closedResponse.data);
    if (!selectedSessionId && openResponse.data[0]) {
      const nextSession = openResponse.data[0];
      setSelectedSessionId(nextSession.id);
      setForm((current) => ({
        ...current,
        countedAmount: String(calculateExpected(nextSession)),
      }));
    }
    return { data: closedResponse.data, total: closedResponse.total };
  }

  function handleSelectSession(sessionId: string) {
    const session = openSessions.find((item) => item.id === sessionId);
    setSelectedSessionId(sessionId);
    setForm((current) => ({
      ...current,
      countedAmount: session ? String(calculateExpected(session)) : "0",
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedSessionId) return;
    setError(null);
    try {
      await closeCashSession({
        accessToken: token,
        organizationId: activeOrganizationId,
        cashSessionId: selectedSessionId,
        body: {
          countedAmount: Number(form.countedAmount || "0"),
          closingNote: form.closingNote,
        },
      });
      setSelectedSessionId("");
      setForm({ countedAmount: "0", closingNote: "" });
      setViewMode("table");
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo cerrar la caja.");
    }
  }

  const selectedSession = openSessions.find((session) => session.id === selectedSessionId);
  const expectedAmount = calculateExpected(selectedSession);
  const countedAmount = Number(form.countedAmount || "0");
  const differenceAmount = countedAmount - expectedAmount;

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Caja"
        title="Cierre"
        description="Cuenta el efectivo real, compara contra lo esperado y cierra la sesion de caja."
        action={
          <div className="flex gap-2">
            {viewMode === "close" ? (
              <AdminActionButton tone="ghost" icon={<ArrowLeftIcon />} onClick={() => setViewMode("table")}>
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton onClick={() => setViewMode("close")} icon={<PlusIcon />} tone="primary" active={viewMode === "close"}>
              Cerrar caja
            </AdminActionButton>
          </div>
        }
        stats={[
          { label: "Abiertas", value: String(openSessions.length), hint: "Pendientes de cierre.", tone: "dark" },
          { label: "Cerradas", value: String(closedSessions.length), hint: "Ultimas sesiones listadas.", tone: "accent" },
          { label: "Diferencia actual", value: `S/ ${differenceAmount.toFixed(2)}`, hint: "Conteo menos esperado." },
        ]}
      />
      {error ? <AdminMessage title="No pudimos cerrar la caja" description={error} tone="warn" /> : null}
      {viewMode === "close" ? (
        <PanelCard title="Cerrar caja" description="Este cierre bloquea nuevos movimientos en la sesion.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">Caja abierta</span>
              <select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={selectedSessionId} onChange={(event) => handleSelectSession(event.target.value)} required>
                <option value="">Selecciona caja</option>
                {openSessions.map((session) => <option key={session.id} value={session.id}>{session.cashRegister?.name} - {session.branch?.name}</option>)}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[#E4E4E4] bg-[#F8F8F8] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7a8b45]">Esperado</p>
                <p className="mt-2 text-2xl font-black text-[#10140b]">S/ {expectedAmount.toFixed(2)}</p>
              </div>
              <div className="rounded-[24px] border border-[#E4E4E4] bg-[#F8F8F8] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7a8b45]">Diferencia</p>
                <p className="mt-2 text-2xl font-black text-[#10140b]">S/ {differenceAmount.toFixed(2)}</p>
              </div>
            </div>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Efectivo contado</span><input type="number" step="0.01" className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.countedAmount} onChange={(event) => setForm((current) => ({ ...current, countedAmount: event.target.value }))} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Nota de cierre</span><textarea className="min-h-24 w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.closingNote} onChange={(event) => setForm((current) => ({ ...current, closingNote: event.target.value }))} /></label>
            <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />} disabled={!selectedSession}>Cerrar caja</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Historial de cierres" description="Sesiones cerradas con esperado, contado y diferencia.">
          <AdminDataTable
            fetchData={fetchClosedSessions}
            reloadKey={`${activeOrganizationId ?? ""}-${reloadKey}`}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar cierre..."
            emptyTitle="Aun no hay cierres"
            emptyDescription="Cuando cierres una caja, aparecera aqui."
            columns={[
              { key: "cash", label: "Caja", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.cashRegister?.name}</p><p className="text-xs text-[#A1A1A1]">{row.branch?.name}</p></div> },
              { key: "expected", label: "Esperado", align: "right", render: (row) => `S/ ${(row.expectedAmount ?? 0).toFixed(2)}` },
              { key: "counted", label: "Contado", align: "right", render: (row) => `S/ ${(row.countedAmount ?? 0).toFixed(2)}` },
              { key: "diff", label: "Diferencia", render: (row) => <Tag tone={(row.differenceAmount ?? 0) === 0 ? "accent" : "warn"}>S/ {(row.differenceAmount ?? 0).toFixed(2)}</Tag> },
              { key: "closed", label: "Cierre", render: (row) => row.closedAt ? new Date(row.closedAt).toLocaleString("es-PE") : "-" },
            ]}
          />
        </PanelCard>
      )}
    </section>
  );
}
