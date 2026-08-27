"use client";

import { useEffect, useState } from "react";
import { ChefHat, CheckCheck, Clock3, Flame, RefreshCw } from "lucide-react";
import { AdminActionButton } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { useToast } from "../../../context/toast-context";
import { getBranches, getKitchenTickets, updateKitchenTicket } from "../../../lib/erp-api";
import type { BranchSummary, KitchenTicketStatus, KitchenTicketSummary } from "../../../types/erp";

const inputClass =
  "rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none focus:border-[#00C70D]";

const columns: Array<{ status: KitchenTicketStatus; label: string; tone: string }> = [
  { status: "SENT", label: "Por preparar", tone: "border-[#f0d6aa] bg-[#fff8e9]" },
  { status: "IN_PREPARATION", label: "En preparación", tone: "border-[#e9b89c] bg-[#fff1e8]" },
  { status: "READY", label: "Listo para entregar", tone: "border-[#c8df8a] bg-[#f5fadf]" },
];

const nextAction: Partial<Record<KitchenTicketStatus, { status: KitchenTicketStatus; label: string }>> = {
  SENT: { status: "IN_PREPARATION", label: "Empezar" },
  IN_PREPARATION: { status: "READY", label: "Marcar listo" },
  READY: { status: "DELIVERED", label: "Entregado" },
};

function elapsedLabel(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function KitchenPage() {
  const { accessToken, activeOrganizationId, refreshSession } = useAuth();
  const toast = useToast();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [branchId, setBranchId] = useState("");
  const [tickets, setTickets] = useState<KitchenTicketSummary[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadTickets(nextBranchId = branchId) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !nextBranchId) return;
    const rows = await getKitchenTickets({
      accessToken: token,
      organizationId: activeOrganizationId,
      branchId: nextBranchId,
    });
    setTickets(rows.filter((ticket) => ["SENT", "IN_PREPARATION", "READY"].includes(ticket.status)));
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
        if (nextBranchId) await loadTickets(nextBranchId);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "No se pudo abrir cocina.");
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  useEffect(() => {
    if (!branchId) return;
    const timer = window.setInterval(() => void loadTickets(), 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  async function advanceTicket(ticket: KitchenTicketSummary) {
    const action = nextAction[ticket.status];
    const token = await resolveToken();
    if (!action || !token || !activeOrganizationId) return;
    setBusyId(ticket.id);
    setError(null);
    try {
      await updateKitchenTicket({
        accessToken: token,
        organizationId: activeOrganizationId,
        ticketId: ticket.id,
        status: action.status as "IN_PREPARATION" | "READY" | "DELIVERED",
      });
      await loadTickets();
    } catch (updateError) {
      toast.showError(updateError, "No se pudo actualizar");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-7">
      <AdminModuleHeader
        eyebrow="Monitor operativo"
        title="Cocina y barra"
        description="Las comandas avanzan en tiempo real desde recepción hasta entrega."
        action={
          <div className="flex gap-3">
            <select
              className={inputClass}
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                void loadTickets(event.target.value);
              }}
            >
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
            <AdminActionButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadTickets()}>
              Actualizar
            </AdminActionButton>
          </div>
        }
      />

      {error ? <AdminMessage title="Cocina necesita atención" description={error} tone="warn" /> : null}

      <div className="grid gap-5 xl:grid-cols-3">
        {columns.map((column) => {
          const rows = tickets.filter((ticket) => ticket.status === column.status);
          return (
            <section key={column.status} className={`min-h-[520px] rounded-[30px] border p-4 ${column.tone}`}>
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  {column.status === "SENT" ? <Clock3 className="h-5 w-5" /> : column.status === "IN_PREPARATION" ? <Flame className="h-5 w-5" /> : <CheckCheck className="h-5 w-5" />}
                  <h2 className="font-semibold text-[#202713]">{column.label}</h2>
                </div>
                <Tag tone={column.status === "READY" ? "accent" : "warn"}>{rows.length}</Tag>
              </div>

              <div className="mt-3 space-y-4">
                {rows.length === 0 ? (
                  <div className="grid min-h-44 place-items-center rounded-[24px] border border-dashed border-black/10 bg-white/50 text-center text-sm text-[#A1A1A1]">
                    <div><ChefHat className="mx-auto mb-2 h-6 w-6" />Sin comandas</div>
                  </div>
                ) : null}
                {rows.map((ticket) => {
                  const action = nextAction[ticket.status];
                  const destination = ticket.openAccount?.diningTable?.name
                    ?? (ticket.openAccount?.serviceType === "DELIVERY" ? "Delivery" : "Para llevar");
                  return (
                    <article key={ticket.id} className="rounded-[24px] border border-black/8 bg-white p-5 shadow-[0_14px_35px_rgba(45,54,22,0.08)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7e865f]">Comanda #{ticket.sequence}</p>
                          <h3 className="mt-1 text-xl font-semibold text-[#0D0D0D]">{destination}</h3>
                          <p className="mt-1 text-xs text-[#7a816d]">{ticket.openAccount?.accountNumber}</p>
                        </div>
                        <span className="rounded-full bg-[#171917] px-3 py-1 text-xs font-semibold text-white">{elapsedLabel(ticket.sentAt)}</span>
                      </div>
                      <div className="mt-4 divide-y divide-[#edf0e6]">
                        {ticket.items.map((item) => (
                          <div key={item.id} className="py-3">
                            <p className="font-semibold text-[#222a16]">{item.quantity} × {item.productName}</p>
                            {item.note ? <p className="mt-1 text-sm font-medium text-[#a04e2b]">{item.note}</p> : null}
                          </div>
                        ))}
                      </div>
                      {ticket.note ? <p className="mt-3 rounded-2xl bg-[#F1F1F1] p-3 text-sm text-[#596147]">{ticket.note}</p> : null}
                      {action ? (
                        <AdminActionButton
                          tone="primary"
                          className="mt-4 w-full justify-center"
                          disabled={busyId === ticket.id}
                          onClick={() => void advanceTicket(ticket)}
                        >
                          {action.label}
                        </AdminActionButton>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
