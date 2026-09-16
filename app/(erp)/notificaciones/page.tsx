"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, RefreshCcw, Search } from "lucide-react";
import { AdminActionButton } from "../../components/admin/AdminActionButton";
import { AdminMessage, AdminPageHeader } from "../../components/admin/AdminBlocks";
import { useAuth } from "../../context/auth-context";
import { useNotifications } from "../../context/notifications-context";
import { useToast } from "../../context/toast-context";
import { getErpNotifications, markAllErpNotificationsAsRead, markErpNotificationAsRead } from "../../lib/erp-api";
import type { ErpNotificationSeverity, ErpNotificationsResponse, ErpNotificationSummary } from "../../types/erp";

const PAGE_SIZE = 20;

const severityClass: Record<ErpNotificationSeverity, string> = {
  INFO: "border-sky-100 bg-sky-50 text-sky-700",
  SUCCESS: "border-emerald-100 bg-emerald-50 text-emerald-700",
  WARNING: "border-amber-100 bg-amber-50 text-amber-700",
  CRITICAL: "border-red-100 bg-red-50 text-red-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function NotificationsPage() {
  const { accessToken, activeOrganizationId, refreshSession } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { showError, showSuccess } = useToast();
  const [result, setResult] = useState<ErpNotificationsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = accessToken ?? (await refreshSession({ silent: true }))?.accessToken;
      if (!token || !activeOrganizationId) throw new Error("No hay una organización activa.");
      setResult(await getErpNotifications({ accessToken: token, organizationId: activeOrganizationId, page, limit: PAGE_SIZE, search: submittedSearch || undefined, unreadOnly }));
    } catch (error) {
      showError(error, "No se pudieron cargar las notificaciones");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeOrganizationId, page, refreshSession, showError, submittedSearch, unreadOnly]);

  useEffect(() => { void load(); }, [load]);

  const markRead = async (notification: ErpNotificationSummary) => {
    if (notification.readAt || !accessToken || !activeOrganizationId) return;
    try {
      await markErpNotificationAsRead({ accessToken, organizationId: activeOrganizationId, notificationId: notification.id });
      await Promise.all([load(), refreshNotifications()]);
    } catch (error) {
      showError(error, "No se pudo actualizar la notificación");
    }
  };

  const markAll = async () => {
    if (!accessToken || !activeOrganizationId || !result?.unread) return;
    try {
      const response = await markAllErpNotificationsAsRead({ accessToken, organizationId: activeOrganizationId });
      await Promise.all([load(), refreshNotifications()]);
      showSuccess(`${response.updated} notificaciones marcadas como leídas.`, "Actividad actualizada");
    } catch (error) {
      showError(error, "No se pudieron marcar las notificaciones");
    }
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const renderNotification = (notification: ErpNotificationSummary) => {
    const content = <><div className="flex items-start gap-4"><span className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${severityClass[notification.severity]}`}><Bell className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-4"><p className="font-semibold text-[var(--kapos-text)]">{notification.title}</p>{!notification.readAt ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--kapos-success)]" aria-label="No leída" /> : null}</div><p className="mt-1.5 text-sm leading-6 text-[var(--kapos-text-soft)]">{notification.message}</p><p className="mt-3 text-xs font-medium text-[var(--kapos-text-muted)]">{formatDate(notification.createdAt)}{notification.branch ? ` · ${notification.branch.name}` : ""}</p></div></div></>;
    const className = `block w-full rounded-[24px] border p-5 text-left transition ${notification.readAt ? "border-[var(--kapos-border)] bg-white/80 hover:bg-[var(--kapos-card)]" : "border-[color-mix(in_srgb,var(--kapos-green)_28%,white)] bg-[linear-gradient(135deg,#fff_0%,var(--kapos-green-wash)_100%)] shadow-[0_12px_28px_rgba(13,13,13,.04)]"}`;
    return notification.route ? <Link key={notification.id} href={notification.route} onClick={() => void markRead(notification)} className={className}>{content}</Link> : <button key={notification.id} type="button" onClick={() => void markRead(notification)} className={className}>{content}</button>;
  };

  return <div className="space-y-6">
    <AdminPageHeader eyebrow="Actividad" title="Notificaciones" description={result ? `${result.total} registros · ${result.unread} sin leer` : "Revisa alertas y eventos relevantes de tu operación."} action={<div className="flex flex-wrap gap-3"><AdminActionButton tone="secondary" icon={<RefreshCcw className="h-4 w-4" />} onClick={() => void load()}>Actualizar</AdminActionButton><AdminActionButton tone="primary" icon={<CheckCheck className="h-4 w-4" />} onClick={() => void markAll()} disabled={!result?.unread}>Marcar leídas</AdminActionButton></div>} />
    <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSubmittedSearch(search.trim()); }} className="flex flex-col gap-3 rounded-[24px] border border-[var(--kapos-border)] bg-white p-4 shadow-[0_12px_26px_rgba(13,13,13,.04)] sm:flex-row sm:items-center"><label className="relative min-w-0 flex-1"><span className="sr-only">Buscar notificaciones</span><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kapos-text-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por evento, producto o mensaje" className="w-full rounded-xl border border-[var(--kapos-border)] py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--kapos-green)]" /></label><label className="inline-flex cursor-pointer items-center gap-2 px-2 text-sm font-semibold text-[var(--kapos-text-soft)]"><input type="checkbox" checked={unreadOnly} onChange={(event) => { setPage(1); setUnreadOnly(event.target.checked); }} className="h-4 w-4 accent-[var(--kapos-green)]" />Solo sin leer</label><AdminActionButton tone="secondary" type="submit">Buscar</AdminActionButton></form>
    {isLoading ? <div className="grid min-h-80 place-items-center rounded-[28px] border border-[var(--kapos-border)] bg-white"><div className="flex items-center gap-3 text-sm font-semibold text-[var(--kapos-text-soft)]"><Loader2 className="h-5 w-5 animate-spin text-[var(--kapos-green)]" />Cargando actividad...</div></div> : result?.data.length ? <><div className="space-y-3">{result.data.map(renderNotification)}</div><div className="flex items-center justify-between gap-4 rounded-[20px] border border-[var(--kapos-border)] bg-white px-5 py-3"><p className="text-sm text-[var(--kapos-text-soft)]">Página {page} de {totalPages}</p><div className="flex gap-2"><AdminActionButton tone="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</AdminActionButton><AdminActionButton tone="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</AdminActionButton></div></div></> : <AdminMessage title="No hay notificaciones para mostrar" description={unreadOnly ? "No tienes alertas pendientes de lectura." : "Los eventos relevantes de tu operación aparecerán aquí."} />}
  </div>;
}
