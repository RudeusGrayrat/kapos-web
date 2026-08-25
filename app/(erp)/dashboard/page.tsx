"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  LayoutGrid,
  Loader2,
  Lock,
  Plug,
  RefreshCcw,
  Settings2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AdminActionButton } from "../../components/admin/AdminActionButton";
import {
  AdminMessage,
  AdminPageHeader,
  PanelCard,
  Tag,
} from "../../components/admin/AdminBlocks";
import { useAuth } from "../../context/auth-context";
import { getDashboard } from "../../lib/erp-api";
import type {
  DashboardListWidget,
  DashboardMetricWidget,
  DashboardRange,
  DashboardSummary,
  DashboardTone,
  DashboardWidget,
} from "../../types/erp";

const rangeOptions: Array<{ value: DashboardRange; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "last_7_days", label: "Ultimos 7 dias" },
  { value: "last_30_days", label: "Ultimos 30 dias" },
];

const toneClass: Record<DashboardTone, string> = {
  accent:
    "border-[color-mix(in_srgb,var(--kapos-green)_18%,white)] bg-[linear-gradient(135deg,#ffffff_0%,var(--kapos-green-wash)_100%)]",
  dark: "border-[var(--kapos-black)] bg-[linear-gradient(135deg,var(--kapos-black)_0%,#141414_100%)] text-white",
  soft: "border-[var(--kapos-border)] bg-[var(--kapos-card)]",
  warn: "border-[color-mix(in_srgb,var(--kapos-warning)_38%,white)] bg-[color-mix(in_srgb,var(--kapos-warning)_10%,white)]",
  danger:
    "border-[color-mix(in_srgb,#ef4444_32%,white)] bg-[color-mix(in_srgb,#ef4444_8%,white)]",
};

const toneTextClass: Record<DashboardTone, string> = {
  accent: "text-[var(--kapos-green-dark)]",
  dark: "text-white",
  soft: "text-[var(--kapos-text)]",
  warn: "text-[var(--kapos-warning)]",
  danger: "text-[#dc2626]",
};

const moduleIconClass: Record<string, string> = {
  sales: "bg-[var(--kapos-black)] text-white",
  catalog: "bg-[var(--kapos-green-wash)] text-[var(--kapos-green-dark)]",
  cash: "bg-[var(--kapos-green-wash)] text-[var(--kapos-green-dark)]",
  billing:
    "bg-[color-mix(in_srgb,var(--kapos-warning)_12%,white)] text-[var(--kapos-warning)]",
  finance:
    "bg-[color-mix(in_srgb,var(--kapos-warning)_12%,white)] text-[var(--kapos-warning)]",
  platform: "bg-[var(--kapos-black)] text-white",
  dashboard: "bg-[var(--kapos-green)] text-white",
};

export default function DashboardPage() {
  const {
    accessToken,
    activeOrganizationId,
    isLoading: isAuthLoading,
    platformContext,
    refreshSession,
  } = useAuth();
  const [range, setRange] = useState<DashboardRange>("last_7_days");
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveToken = useCallback(async () => {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }, [accessToken, refreshSession]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await resolveToken();
      if (!token) {
        throw new Error("No hay sesion activa.");
      }
      const data = await getDashboard({
        accessToken: token,
        organizationId: activeOrganizationId,
        range,
      });
      setDashboard(data);
    } catch (loadError) {
      setDashboard(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganizationId, range, resolveToken]);

  useEffect(() => {
    if (isAuthLoading) return;
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [isAuthLoading, loadDashboard]);

  const visibleWidgets = useMemo(
    () =>
      dashboard?.widgets.filter(
        (widget) => !hiddenWidgets.includes(widget.key),
      ) ?? [],
    [dashboard, hiddenWidgets],
  );
  const isPlatformDashboard = dashboard?.context.scope === "PLATFORM";
  const hasAnyContext = Boolean(activeOrganizationId || platformContext);

  function toggleWidget(widgetKey: string) {
    setHiddenWidgets((current) =>
      current.includes(widgetKey)
        ? current.filter((key) => key !== widgetKey)
        : [...current, widgetKey],
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Dashboard"
        title={isPlatformDashboard ? "Resumen platform" : "Resumen general"}
        description={
          dashboard
            ? `${dashboard.context.title} · ${dashboard.context.permissionCount} permisos activos · ${dashboard.context.moduleKeys.length} modulos disponibles`
            : "Cargando, si tarda no tienes nada o hay un error."
        }
        action={
          <div className="flex flex-wrap gap-3">
            <select
              className="h-12 rounded-[18px] border border-[var(--kapos-border)] bg-white px-4 text-sm font-semibold text-[var(--kapos-text)] outline-none transition focus:border-[var(--kapos-green)]"
              value={range}
              onChange={(event) =>
                setRange(event.target.value as DashboardRange)
              }
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <AdminActionButton
              tone="secondary"
              onClick={() => void loadDashboard()}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </AdminActionButton>
          </div>
        }
      />

      {!hasAnyContext && !isAuthLoading ? (
        <AdminMessage
          title="Sin accesos activos"
          description="Cargando, si tarda no tienes nada o hay un error."
          tone="warn"
        />
      ) : null}

      {error ? (
        <AdminMessage
          title="No se pudo cargar el dashboard"
          description={error}
          tone="warn"
        />
      ) : null}

      {isLoading ? (
        <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-[var(--kapos-border)] bg-white">
          <div className="flex items-center gap-3 text-sm font-semibold text-[var(--kapos-text-soft)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--kapos-green)]" />
            Cargando dashboard...
          </div>
        </div>
      ) : dashboard ? (
        <>
          {dashboard.notifications.length > 0 ? (
            <section className="grid gap-4 lg:grid-cols-3">
              {dashboard.notifications.map((notification) => (
                <NotificationCard
                  key={notification.key}
                  notification={notification}
                />
              ))}
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleWidgets
              .filter((widget) => widget.type === "metric")
              .map((widget) => (
                <MetricWidget key={widget.key} widget={widget} />
              ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
            <div className="space-y-5">
              {visibleWidgets
                .filter((widget) => widget.type === "chart")
                .map((widget) => (
                  <ChartWidget key={widget.key} widget={widget} />
                ))}
            </div>
            <PanelCard
              title="Plugins y widgets"
              description="Activa u oculta bloques disponibles segun tus permisos. Luego podremos persistir este layout por usuario."
              action={
                <Tag tone="accent">
                  {dashboard.availableWidgets.length} disponibles
                </Tag>
              }
            >
              <div className="space-y-3">
                {dashboard.availableWidgets.map((widget) => {
                  const isHidden = hiddenWidgets.includes(widget.key);
                  return (
                    <button
                      key={widget.key}
                      type="button"
                      onClick={() => toggleWidget(widget.key)}
                      className="flex w-full items-center justify-between gap-4 rounded-[20px] border border-[var(--kapos-border)] bg-white px-4 py-3 text-left transition hover:border-[var(--kapos-green)]"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--kapos-text)]">
                          {widget.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--kapos-text-soft)]">
                          {widget.description}
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isHidden
                            ? "bg-[var(--kapos-card-alt)] text-[var(--kapos-text-soft)]"
                            : "bg-[var(--kapos-green)] text-white"
                        }`}
                      >
                        {isHidden ? "Oculto" : "Activo"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </PanelCard>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            {visibleWidgets
              .filter((widget) => widget.type === "list")
              .map((widget) => (
                <ListWidget key={widget.key} widget={widget} />
              ))}
          </section>

          <PanelCard
            title="Atajos inteligentes"
            description="Estos accesos vienen del catalogo real de modulos y submodulos; si agregas uno nuevo y das permiso, aparece aqui."
            action={<Tag tone="dark">{dashboard.shortcuts.length} atajos</Tag>}
          >
            {dashboard.shortcuts.length === 0 ? (
              <AdminMessage
                title="Sin atajos disponibles"
                description="Cargando, si tarda no tienes nada o hay un error."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {dashboard.shortcuts.map((shortcut) => (
                  <Link
                    key={shortcut.key}
                    href={shortcut.route}
                    className="group flex min-h-24 items-center justify-between gap-4 rounded-[22px] border border-[var(--kapos-border)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--kapos-green)] hover:shadow-[0_18px_35px_rgba(13,13,13,0.08)]"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--kapos-text)]">
                        {shortcut.label}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[var(--kapos-text-soft)]">
                        {shortcut.moduleKey}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-[var(--kapos-green)] transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            )}
          </PanelCard>
        </>
      ) : null}
    </div>
  );
}

function MetricWidget({ widget }: { widget: DashboardMetricWidget }) {
  const isDark = widget.tone === "dark";

  return (
    <article
      className={`rounded-[26px] border p-5 shadow-[0_18px_38px_rgba(13,13,13,0.06)] ${toneClass[widget.tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`grid h-12 w-12 place-items-center rounded-[16px] ${
            moduleIconClass[widget.moduleKey] ??
            "bg-[var(--kapos-green-wash)] text-[var(--kapos-green-dark)]"
          }`}
        >
          {iconForModule(widget.moduleKey)}
        </span>
        {widget.trend !== undefined && widget.trend !== null ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              widget.trend >= 0
                ? "bg-[color-mix(in_srgb,var(--kapos-green)_13%,white)] text-[var(--kapos-green-dark)]"
                : "bg-[color-mix(in_srgb,#ef4444_12%,white)] text-[#dc2626]"
            }`}
          >
            {widget.trend >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(widget.trend)}%
          </span>
        ) : null}
      </div>
      <p
        className={`mt-4 text-sm ${
          isDark ? "text-white/68" : "text-[var(--kapos-text-soft)]"
        }`}
      >
        {widget.title}
      </p>
      <strong
        className={`mt-2 block text-3xl font-semibold tracking-[-0.04em] ${
          isDark ? "text-white" : "text-[var(--kapos-text)]"
        }`}
      >
        {widget.value}
      </strong>
      <p
        className={`mt-2 text-sm leading-6 ${
          isDark ? "text-white/62" : "text-[var(--kapos-text-soft)]"
        }`}
      >
        {widget.hint}
      </p>
    </article>
  );
}

function ChartWidget({
  widget,
}: {
  widget: Extract<DashboardWidget, { type: "chart" }>;
}) {
  const max = Math.max(...widget.data.map((item) => item.value), 1);

  return (
    <PanelCard
      title={widget.title}
      description={widget.hint}
      action={<Tag tone="accent">En vivo</Tag>}
    >
      <div className="flex h-72 items-end gap-2 rounded-[22px] border border-[var(--kapos-border)] bg-white px-4 py-5">
        {widget.data.map((item) => (
          <div
            key={item.label}
            className="flex h-full min-w-0 flex-1 flex-col justify-end gap-3"
          >
            <div className="relative flex flex-1 items-end rounded-full bg-[var(--kapos-card-alt)]">
              <div
                className="w-full rounded-full bg-[linear-gradient(180deg,var(--kapos-green)_0%,var(--kapos-green-dark)_100%)]"
                style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
              />
            </div>
            <span className="truncate text-center text-xs font-medium text-[var(--kapos-text-soft)]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function ListWidget({ widget }: { widget: DashboardListWidget }) {
  return (
    <PanelCard title={widget.title} description={widget.hint}>
      {widget.items.length === 0 ? (
        <div className="grid min-h-28 place-items-center rounded-[20px] border border-[var(--kapos-border)] bg-white text-sm text-[var(--kapos-text-soft)]">
          Sin datos por ahora.
        </div>
      ) : (
        <div className="space-y-3">
          {widget.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--kapos-border)] bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--kapos-text)]">
                  {item.label}
                </p>
                {item.meta ? (
                  <p className="mt-1 truncate text-xs text-[var(--kapos-text-soft)]">
                    {item.meta}
                  </p>
                ) : null}
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  toneTextClass[item.tone ?? widget.tone]
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

function NotificationCard({
  notification,
}: {
  notification: DashboardSummary["notifications"][number];
}) {
  const content = (
    <article
      className={`flex min-h-28 items-start gap-4 rounded-[24px] border p-5 shadow-[0_18px_36px_rgba(13,13,13,0.05)] ${toneClass[notification.tone]}`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-white text-[var(--kapos-green-dark)] shadow-[0_12px_24px_rgba(13,13,13,0.06)]">
        <Bell className="h-5 w-5" />
      </span>
      <span>
        <strong className="block text-sm text-[var(--kapos-text)]">
          {notification.title}
        </strong>
        <span className="mt-1 block text-xs leading-5 text-[var(--kapos-text-soft)]">
          {notification.description}
        </span>
      </span>
    </article>
  );

  return notification.route ? (
    <Link href={notification.route}>{content}</Link>
  ) : (
    content
  );
}

function iconForModule(moduleKey: string) {
  if (moduleKey === "sales") return <BarChart3 className="h-5 w-5" />;
  if (moduleKey === "catalog") return <Boxes className="h-5 w-5" />;
  if (moduleKey === "cash") return <Zap className="h-5 w-5" />;
  if (moduleKey === "billing") return <AlertTriangle className="h-5 w-5" />;
  if (moduleKey === "finance") return <AlertTriangle className="h-5 w-5" />;
  if (moduleKey === "platform") return <Lock className="h-5 w-5" />;
  if (moduleKey === "dashboard") return <Plug className="h-5 w-5" />;
  if (moduleKey === "settings") return <Settings2 className="h-5 w-5" />;
  return <LayoutGrid className="h-5 w-5" />;
}
