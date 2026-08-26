"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  Check,
  GripVertical,
  LayoutGrid,
  Loader2,
  Lock,
  Plug,
  Plus,
  RefreshCcw,
  Settings2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AdminActionButton, PlusIcon } from "../../components/admin/AdminActionButton";
import {
  AdminMessage,
  AdminPageHeader,
  Tag,
} from "../../components/admin/AdminBlocks";
import { useAuth } from "../../context/auth-context";
import { useToast } from "../../context/toast-context";
import { getDashboard, updateDashboardPreferences } from "../../lib/erp-api";
import type {
  DashboardListWidget,
  DashboardLayoutItem,
  DashboardMetricWidget,
  DashboardRange,
  DashboardShortcut,
  DashboardSummary,
  DashboardTone,
  DashboardWidget,
} from "../../types/erp";

const rangeOptions: Array<{ value: DashboardRange; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "last_7_days", label: "Ultimos 7 dias" },
  { value: "last_30_days", label: "Ultimos 30 dias" },
];

const dashboardGrid = {
  columns: 6,
  rows: 4,
  capacity: 24,
};

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
  const { showError, showSuccess } = useToast();
  const [range, setRange] = useState<DashboardRange>("last_7_days");
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [selectedWidgetKeys, setSelectedWidgetKeys] = useState<string[]>([]);
  const [selectedShortcutKeys, setSelectedShortcutKeys] = useState<string[]>([]);
  const [draftLayoutItems, setDraftLayoutItems] = useState<DashboardLayoutItem[]>([]);
  const [draggedHomeItemId, setDraggedHomeItemId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
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
      setSelectedWidgetKeys(data.preferences.selectedWidgetKeys);
      setSelectedShortcutKeys(data.preferences.selectedShortcutKeys);
      setDraftLayoutItems(data.preferences.layoutItems);
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

  const effectiveLayoutItems = dashboard
    ? normalizeDraftLayoutItems({
      dashboard,
      widgetKeys: isConfigOpen
        ? selectedWidgetKeys
        : dashboard.preferences.selectedWidgetKeys,
      shortcutKeys: isConfigOpen
        ? selectedShortcutKeys
        : dashboard.preferences.selectedShortcutKeys,
      currentLayoutItems: isConfigOpen
        ? draftLayoutItems
        : dashboard.preferences.layoutItems,
    })
    : [];
  const homeItems = dashboard
    ? buildHomeItems({
      dashboard,
      layoutItems: effectiveLayoutItems,
      widgetKeys: isConfigOpen
        ? selectedWidgetKeys
        : dashboard.preferences.selectedWidgetKeys,
      shortcutKeys: isConfigOpen
        ? selectedShortcutKeys
        : dashboard.preferences.selectedShortcutKeys,
      allowDraftWidgets: isConfigOpen,
    })
    : [];
  const isPlatformDashboard = dashboard?.context.scope === "PLATFORM";
  const hasAnyContext = Boolean(activeOrganizationId || platformContext);
  const selectedCellCount = dashboard
    ? calculateSelectedCellCount({
      widgetKeys: selectedWidgetKeys,
      shortcutKeys: selectedShortcutKeys,
      dashboard,
    })
    : 0;

  function toggleWidget(widgetKey: string) {
    if (
      dashboard &&
      !selectedWidgetKeys.includes(widgetKey) &&
      selectedCellCount + getWidgetDefinitionCells(dashboard, widgetKey) >
      dashboardGrid.capacity
    ) {
      showError("Tu dashboard esta lleno. Quita algo antes de agregar otro widget.", "Sin espacio");
      return;
    }

    setSelectedWidgetKeys((current) => {
      const isSelected = current.includes(widgetKey);
      const next = isSelected
        ? current.filter((key) => key !== widgetKey)
        : [...current, widgetKey];
      syncDraftLayout({
        widgetKeys: next,
        shortcutKeys: selectedShortcutKeys,
      });
      return next;
    });
  }

  function toggleShortcut(shortcutKey: string) {
    if (
      dashboard &&
      !selectedShortcutKeys.includes(shortcutKey) &&
      selectedCellCount + 1 > dashboardGrid.capacity
    ) {
      showError("Tu dashboard esta lleno. Quita algo antes de agregar otro acceso.", "Sin espacio");
      return;
    }

    setSelectedShortcutKeys((current) => {
      const isSelected = current.includes(shortcutKey);
      const next = isSelected
        ? current.filter((key) => key !== shortcutKey)
        : [...current, shortcutKey];
      syncDraftLayout({
        widgetKeys: selectedWidgetKeys,
        shortcutKeys: next,
      });
      return next;
    });
  }

  function syncDraftLayout(input: {
    widgetKeys: string[];
    shortcutKeys: string[];
  }) {
    if (!dashboard) return;

    setDraftLayoutItems((current) =>
      normalizeDraftLayoutItems({
        dashboard,
        widgetKeys: input.widgetKeys,
        shortcutKeys: input.shortcutKeys,
        currentLayoutItems: current,
      }),
    );
  }

  function moveHomeItem(targetId: string) {
    if (!draggedHomeItemId || draggedHomeItemId === targetId) return;

    setDraftLayoutItems((current) => {
      const swapped = swapLayoutPositions(current, draggedHomeItemId, targetId);

      if (isValidLayout(swapped)) {
        return swapped;
      }

      if (!dashboard) return current;

      return normalizeDraftLayoutItems({
        dashboard,
        widgetKeys: selectedWidgetKeys,
        shortcutKeys: selectedShortcutKeys,
        currentLayoutItems: moveLayoutItemBefore(
          current,
          draggedHomeItemId,
          targetId,
        ),
      });
    });
  }

  async function savePreferences() {
    setIsSavingPreferences(true);

    try {
      const token = await resolveToken();
      if (!token) {
        throw new Error("No hay sesion activa.");
      }
      await updateDashboardPreferences({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          selectedWidgetKeys,
          selectedShortcutKeys,
          layoutItems: dashboard
            ? effectiveLayoutItems
            : undefined,
        },
      });
      await loadDashboard();
      showSuccess("Tu dashboard se actualizo correctamente.", "Preferencias guardadas");
      setIsConfigOpen(false);
    } catch (saveError) {
      showError(saveError, "No se pudo guardar");
    } finally {
      setIsSavingPreferences(false);
    }
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
              tone="primary"
              icon={<PlusIcon />}
              onClick={() => {
                if (dashboard) {
                  setSelectedWidgetKeys(dashboard.preferences.selectedWidgetKeys);
                  setSelectedShortcutKeys(dashboard.preferences.selectedShortcutKeys);
                  setDraftLayoutItems(dashboard.preferences.layoutItems);
                }
                setIsConfigOpen(true);
              }}
            >
              Configurar
            </AdminActionButton>
            <AdminActionButton
              tone="secondary"
              icon={<RefreshCcw />}
              onClick={() => void loadDashboard()}
            >
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

          {isConfigOpen ? (
            <DashboardConfigPanel
              dashboard={dashboard}
              selectedWidgetKeys={selectedWidgetKeys}
              selectedShortcutKeys={selectedShortcutKeys}
              selectedCellCount={selectedCellCount}
              isSavingPreferences={isSavingPreferences}
              onToggleWidget={toggleWidget}
              onToggleShortcut={toggleShortcut}
              onCancel={() => {
                setSelectedWidgetKeys(dashboard.preferences.selectedWidgetKeys);
                setSelectedShortcutKeys(dashboard.preferences.selectedShortcutKeys);
                setDraftLayoutItems(dashboard.preferences.layoutItems);
                setDraggedHomeItemId(null);
                setIsConfigOpen(false);
              }}
              onSave={() => void savePreferences()}
            />
          ) : null}

          {homeItems.length === 0 ? (
            <AdminMessage
              title="Sin widgets activos"
              description="Cargando, si tarda no tienes nada o hay un error."
            />
          ) : (
            <section className="grid auto-rows-[156px] grid-cols-6 gap-4 overflow-hidden">
              {homeItems.map((item) => (
                <DashboardHomeItem
                  key={`${item.layout.type}:${item.layout.key}`}
                  item={item}
                  isEditing={isConfigOpen}
                  isDragging={draggedHomeItemId === layoutId(item.layout)}
                  onDragStart={() => setDraggedHomeItemId(layoutId(item.layout))}
                  onDragOver={(event) => {
                    if (isConfigOpen && draggedHomeItemId) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    moveHomeItem(layoutId(item.layout));
                  }}
                  onDragEnd={() => setDraggedHomeItemId(null)}
                />
              ))}
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

type DashboardHomeItem =
  | { layout: DashboardLayoutItem; kind: "widget"; widget: DashboardWidget }
  | { layout: DashboardLayoutItem; kind: "shortcut"; shortcut: DashboardShortcut }
  | { layout: DashboardLayoutItem; kind: "draftWidget"; title: string; description: string };

function DashboardHomeItem({
  item,
  isEditing,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: DashboardHomeItem;
  isEditing: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const style = {
    gridColumn: `${item.layout.x + 1} / span ${item.layout.w}`,
    gridRow: `${item.layout.y + 1} / span ${item.layout.h}`,
  } satisfies CSSProperties;

  return (
    <div
      className={`relative min-w-0 transition ${isEditing
        ? "cursor-grab rounded-[28px] ring-2 ring-[var(--kapos-green)]/20 hover:ring-[var(--kapos-green)]/45 active:cursor-grabbing"
        : ""
        } ${isDragging ? "scale-[0.98] opacity-60" : ""}`}
      style={style}
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {isEditing ? (
        <span className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-[var(--kapos-border)] bg-white text-[var(--kapos-text-soft)] shadow-[0_10px_24px_rgba(13,13,13,0.12)]">
          <GripVertical className="h-4 w-4" />
        </span>
      ) : null}
      {item.kind === "shortcut" ? (
        <DashboardShortcutItem shortcut={item.shortcut} />
      ) : null}
      {item.kind === "draftWidget" ? (
        <DraftWidgetCard title={item.title} description={item.description} />
      ) : null}
      {item.kind === "widget" && item.widget.type === "metric" ? (
        <MetricWidget widget={item.widget} />
      ) : null}
      {item.kind === "widget" && item.widget.type === "chart" ? (
        <ChartWidget widget={item.widget} />
      ) : null}
      {item.kind === "widget" && item.widget.type === "list" ? (
        <ListWidget widget={item.widget} />
      ) : null}
    </div>
  );
}

function DashboardConfigPanel({
  dashboard,
  selectedWidgetKeys,
  selectedShortcutKeys,
  selectedCellCount,
  isSavingPreferences,
  onToggleWidget,
  onToggleShortcut,
  onCancel,
  onSave,
}: {
  dashboard: DashboardSummary;
  selectedWidgetKeys: string[];
  selectedShortcutKeys: string[];
  selectedCellCount: number;
  isSavingPreferences: boolean;
  onToggleWidget: (key: string) => void;
  onToggleShortcut: (key: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--kapos-border)] bg-white p-5 shadow-[0_18px_42px_rgba(13,13,13,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--kapos-green)]">
            Editando home
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--kapos-text)]">
            Configurar dashboard
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--kapos-text-soft)]">
            Arrastra los tiles del home para intercambiar posiciones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tag tone={selectedCellCount >= dashboardGrid.capacity ? "warn" : "accent"}>
            {selectedCellCount}/{dashboardGrid.capacity} espacios
          </Tag>
          <AdminActionButton tone="secondary" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancelar
          </AdminActionButton>
          <AdminActionButton
            tone="primary"
            onClick={onSave}
            disabled={isSavingPreferences}
          >
            {isSavingPreferences ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Guardar
          </AdminActionButton>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ConfigSection title="Widgets" count={dashboard.availableWidgets.length}>
          {dashboard.availableWidgets.map((widget) => (
            <ConfigOption
              key={widget.key}
              title={widget.title}
              description={widget.description}
              meta={`${getWidgetDefinitionCells(dashboard, widget.key)} espacios`}
              isSelected={selectedWidgetKeys.includes(widget.key)}
              onClick={() => onToggleWidget(widget.key)}
            />
          ))}
        </ConfigSection>
        <ConfigSection title="Apps del home" count={dashboard.availableShortcuts.length}>
          {dashboard.availableShortcuts.map((shortcut) => (
            <ConfigOption
              key={shortcut.key}
              title={`Ir a ${shortcut.label}`}
              description={shortcut.moduleKey}
              meta="1 espacio"
              isSelected={selectedShortcutKeys.includes(shortcut.key)}
              onClick={() => onToggleShortcut(shortcut.key)}
            />
          ))}
        </ConfigSection>
      </div>
    </section>
  );
}

function ConfigSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--kapos-text)]">{title}</h3>
        <Tag tone="dark">{count} disponibles</Tag>
      </div>
      <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function ConfigOption({
  title,
  description,
  meta,
  isSelected,
  onClick,
}: {
  title: string;
  description: string;
  meta: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-20 items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition ${isSelected
        ? "border-[var(--kapos-green)] bg-[var(--kapos-green-wash)]"
        : "border-[var(--kapos-border)] bg-white hover:border-[var(--kapos-green)]"
        }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isSelected
          ? "bg-[var(--kapos-green)] text-white"
          : "bg-[var(--kapos-card-alt)] text-transparent"
          }`}
      >
        <Check className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--kapos-text)]">
          {title}
        </span>
        <span className="mt-1 block truncate text-xs text-[var(--kapos-text-soft)]">
          {description}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-[var(--kapos-card)] px-2 py-1 text-[11px] font-semibold text-[var(--kapos-text-soft)]">
        {meta}
      </span>
    </button>
  );
}

function DraftWidgetCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="flex h-full flex-col justify-between rounded-[26px] border border-dashed border-[var(--kapos-green)] bg-[var(--kapos-green-wash)] p-5">
      <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-white text-[var(--kapos-green-dark)]">
        <LayoutGrid className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-[var(--kapos-text-soft)]">{title}</p>
        <strong className="mt-2 block text-xl font-semibold text-[var(--kapos-text)]">
          Listo para agregar
        </strong>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--kapos-text-soft)]">
          {description}
        </p>
      </div>
    </article>
  );
}

function DashboardShortcutItem({ shortcut }: { shortcut: DashboardShortcut }) {
  return (
    <Link
      href={shortcut.route}
      className="group flex h-full min-w-0 flex-col justify-between rounded-[22px] border border-[var(--kapos-border)] bg-white p-3 shadow-[0_14px_26px_rgba(13,13,13,0.05)] transition hover:-translate-y-0.5 hover:border-[var(--kapos-green)] hover:shadow-[0_18px_35px_rgba(13,13,13,0.08)]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-[var(--kapos-green-wash)] text-[var(--kapos-green-dark)]">
        {iconForModule(shortcut.moduleKey)}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-[var(--kapos-text-soft)]">
          Ir a
        </span>
        <span className="line-clamp-1 text-xs font-semibold leading-tight text-[var(--kapos-text)]">
          {shortcut.label}
        </span>
      </span>
    </Link>
  );
}

function MetricWidget({ widget }: { widget: DashboardMetricWidget }) {
  const isDark = widget.tone === "dark";

  return (
    <article
      className={`flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-[24px] border p-4 shadow-[0_18px_38px_rgba(13,13,13,0.06)] ${toneClass[widget.tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`grid h-9 w-9 place-items-center rounded-[14px] ${moduleIconClass[widget.moduleKey] ??
            "bg-[var(--kapos-green-wash)] text-[var(--kapos-green-dark)]"
            }`}
        >
          {iconForModule(widget.moduleKey)}
        </span>
        {widget.trend !== undefined && widget.trend !== null ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${widget.trend >= 0
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
      <div>
        <p
          className={`truncate text-xs font-medium ${isDark ? "text-white/68" : "text-[var(--kapos-text-soft)]"
            }`}
        >
          {widget.title}
        </p>
        <strong
          className={`mt-1 block truncate text-2xl font-semibold tracking-normal ${isDark ? "text-white" : "text-[var(--kapos-text)]"
            }`}
        >
          {widget.value}
        </strong>
        <p
          className={`mt-1 line-clamp-2 text-xs leading-5 ${isDark ? "text-white/62" : "text-[var(--kapos-text-soft)]"
            }`}
        >
          {widget.hint}
        </p>
      </div>
    </article>
  );
}

function ChartWidget({
  widget,
}: {
  widget: Extract<DashboardWidget, { type: "chart" }>;
}) {
  const total = widget.data.reduce((sum, item) => sum + item.value, 0);
  const average = widget.data.length > 0 ? total / widget.data.length : 0;
  const peak = widget.data.reduce(
    (currentPeak, item) => (item.value > currentPeak.value ? item : currentPeak),
    widget.data[0] ?? { label: "-", value: 0 },
  );

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-[var(--kapos-border)] bg-white p-5 shadow-[0_18px_38px_rgba(13,13,13,0.06)]">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-[var(--kapos-text)]">{widget.title}</h3>
          <p className="mt-1 truncate text-sm text-[var(--kapos-text-soft)]">{widget.hint}</p>
        </div>
        <Tag tone="accent">{formatCompactNumber(total)}</Tag>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <ChartStat label="Total" value={formatCompactNumber(total)} />
        <ChartStat label="Promedio" value={formatCompactNumber(average)} />
        <ChartStat label="Pico" value={`${peak.label} · ${formatCompactNumber(peak.value)}`} />
      </div>
      <div className="mt-3 min-h-0 flex-1">
        <TrendChart data={widget.data} />
      </div>
    </article>
  );
}

function TrendChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const width = 720;
  const height = 260;
  const padding = { top: 18, right: 16, bottom: 34, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const rawMax = Math.max(...data.map((item) => item.value), 0);
  const max = rawMax > 0 ? rawMax : 1;
  const pointCount = Math.max(data.length - 1, 1);
  const points = data.map((item, index) => {
    const x = padding.left + (chartWidth / pointCount) * index;
    const y = padding.top + chartHeight - (item.value / max) * chartHeight;
    return { ...item, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
      : "";
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="h-full min-h-[160px] w-full overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,#ffffff_0%,var(--kapos-green-wash)_100%)]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Tendencia">
        <defs>
          <linearGradient id="dashboardTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--kapos-green)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--kapos-green)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map((line) => {
          const y = padding.top + chartHeight * line;
          const value = max * (1 - line);
          return (
            <g key={line}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#E4E4E4" strokeDasharray="6 8" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-[var(--kapos-text-soft)] text-[11px] font-semibold">
                {formatAxisNumber(value, rawMax)}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#dashboardTrendFill)" />
        <path d={linePath} fill="none" stroke="var(--kapos-green)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={`${point.label}-${point.value}`}>
            <circle cx={point.x} cy={point.y} r="6" fill="white" stroke="var(--kapos-green)" strokeWidth="4" />
            <text x={point.x} y={height - 12} textAnchor="middle" className="fill-[var(--kapos-text-soft)] text-[12px] font-semibold">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--kapos-border)] bg-[var(--kapos-card)] px-3 py-2">
      <span className="block text-xs font-medium text-[var(--kapos-text-soft)]">{label}</span>
      <strong className="mt-1 block truncate text-sm font-semibold text-[var(--kapos-text)]">{value}</strong>
    </div>
  );
}

function ListWidget({ widget }: { widget: DashboardListWidget }) {
  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-[var(--kapos-border)] bg-white p-5 shadow-[0_18px_38px_rgba(13,13,13,0.06)]">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-[var(--kapos-text)]">{widget.title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--kapos-text-soft)]">{widget.hint}</p>
      </div>
      {widget.items.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-items-center rounded-[20px] border border-[var(--kapos-border)] bg-[var(--kapos-card)] text-sm text-[var(--kapos-text-soft)]">
          Sin datos por ahora.
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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
                className={`shrink-0 text-sm font-semibold ${toneTextClass[item.tone ?? widget.tone]
                  }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
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

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es-PE", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatAxisNumber(value: number, rawMax: number) {
  if (rawMax <= 0) return value === 0 ? "0" : "";
  if (rawMax <= 10) {
    return new Intl.NumberFormat("es-PE", {
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatCompactNumber(value);
}

function buildHomeItems(input: {
  dashboard: DashboardSummary;
  layoutItems: DashboardLayoutItem[];
  widgetKeys: string[];
  shortcutKeys: string[];
  allowDraftWidgets: boolean;
}): DashboardHomeItem[] {
  const { dashboard, layoutItems, widgetKeys, shortcutKeys, allowDraftWidgets } = input;
  const widgets = new Map(dashboard.widgets.map((widget) => [widget.key, widget]));
  const availableWidgets = new Map(
    dashboard.availableWidgets.map((widget) => [widget.key, widget]),
  );
  const shortcuts = new Map(
    dashboard.availableShortcuts.map((shortcut) => [shortcut.key, shortcut]),
  );
  const selectedWidgetKeys = new Set(widgetKeys);
  const selectedShortcutKeys = new Set(shortcutKeys);

  return layoutItems
    .map((layout) => {
      if (layout.type === "shortcut") {
        if (!selectedShortcutKeys.has(layout.key)) return null;
        const shortcut = shortcuts.get(layout.key);
        return shortcut
          ? ({ layout, kind: "shortcut", shortcut } satisfies DashboardHomeItem)
          : null;
      }

      if (!selectedWidgetKeys.has(layout.key)) return null;
      const widget = widgets.get(layout.key);
      if (widget) {
        return { layout, kind: "widget", widget } satisfies DashboardHomeItem;
      }

      const definition = availableWidgets.get(layout.key);
      return definition && allowDraftWidgets
        ? ({
          layout,
          kind: "draftWidget",
          title: definition.title,
          description: definition.description,
        } satisfies DashboardHomeItem)
        : null;
    })
    .filter((item): item is DashboardHomeItem => Boolean(item));
}

function calculateSelectedCellCount(input: {
  widgetKeys: string[];
  shortcutKeys: string[];
  dashboard: DashboardSummary;
}) {
  return (
    input.widgetKeys.reduce(
      (total, key) => total + getWidgetDefinitionCells(input.dashboard, key),
      0,
    ) + input.shortcutKeys.length
  );
}

function getWidgetDefinitionCells(dashboard: DashboardSummary, key: string) {
  const definition = dashboard.availableWidgets.find((widget) => widget.key === key);
  const size = getWidgetDefinitionSize(definition?.defaultSize);
  return size.w * size.h;
}

function getWidgetDefinitionSize(defaultSize: "sm" | "md" | "lg" | undefined) {
  if (defaultSize === "lg") return { w: 4, h: 3 };
  if (defaultSize === "md") return { w: 3, h: 2 };
  return { w: 2, h: 1 };
}

function normalizeDraftLayoutItems(input: {
  dashboard: DashboardSummary;
  widgetKeys: string[];
  shortcutKeys: string[];
  currentLayoutItems: DashboardLayoutItem[];
}) {
  const expected = [
    ...input.widgetKeys.map((key) => ({
      key,
      type: "widget" as const,
      size: getWidgetDefinitionSize(
        input.dashboard.availableWidgets.find((widget) => widget.key === key)
          ?.defaultSize,
      ),
    })),
    ...input.shortcutKeys.map((key) => ({
      key,
      type: "shortcut" as const,
      size: { w: 1, h: 1 },
    })),
  ];
  const expectedMap = new Map(
    expected.map((item) => [`${item.type}:${item.key}`, item]),
  );
  const ordered = [
    ...input.currentLayoutItems
      .map((item) => expectedMap.get(`${item.type}:${item.key}`))
      .filter((item): item is (typeof expected)[number] => Boolean(item)),
    ...expected.filter(
      (item) =>
        !input.currentLayoutItems.some(
          (layout) => layout.type === item.type && layout.key === item.key,
        ),
    ),
  ];
  const uniqueOrdered = Array.from(
    new Map(ordered.map((item) => [`${item.type}:${item.key}`, item])).values(),
  );
  const occupied = createGridMap();
  const layoutItems: DashboardLayoutItem[] = [];

  for (const item of uniqueOrdered) {
    const position = findFirstAvailablePosition(occupied, item.size);
    if (!position) continue;

    const layoutItem = {
      key: item.key,
      type: item.type,
      x: position.x,
      y: position.y,
      w: item.size.w,
      h: item.size.h,
    };
    placeLayoutItem(occupied, layoutItem);
    layoutItems.push(layoutItem);
  }

  return layoutItems;
}

function swapLayoutPositions(
  layoutItems: DashboardLayoutItem[],
  sourceId: string,
  targetId: string,
) {
  const source = layoutItems.find((item) => layoutId(item) === sourceId);
  const target = layoutItems.find((item) => layoutId(item) === targetId);

  if (!source || !target) return layoutItems;

  return layoutItems.map((item) => {
    if (layoutId(item) === sourceId) {
      return { ...item, x: target.x, y: target.y };
    }

    if (layoutId(item) === targetId) {
      return { ...item, x: source.x, y: source.y };
    }

    return item;
  });
}

function moveLayoutItemBefore(
  layoutItems: DashboardLayoutItem[],
  sourceId: string,
  targetId: string,
) {
  const sourceIndex = layoutItems.findIndex((item) => layoutId(item) === sourceId);
  const targetIndex = layoutItems.findIndex((item) => layoutId(item) === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return layoutItems;
  }

  const next = [...layoutItems];
  const [source] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, source);
  return next;
}

function isValidLayout(layoutItems: DashboardLayoutItem[]) {
  const occupied = createGridMap();

  for (const item of layoutItems) {
    if (!canPlaceLayoutItem(occupied, item)) {
      return false;
    }

    placeLayoutItem(occupied, item);
  }

  return true;
}

function layoutId(item: Pick<DashboardLayoutItem, "type" | "key">) {
  return `${item.type}:${item.key}`;
}

function createGridMap() {
  return Array.from({ length: dashboardGrid.rows }, () =>
    Array.from({ length: dashboardGrid.columns }, () => false),
  );
}

function findFirstAvailablePosition(
  occupied: boolean[][],
  size: { w: number; h: number },
) {
  for (let y = 0; y <= dashboardGrid.rows - size.h; y += 1) {
    for (let x = 0; x <= dashboardGrid.columns - size.w; x += 1) {
      const candidate = {
        key: "candidate",
        type: "widget" as const,
        x,
        y,
        ...size,
      };

      if (canPlaceLayoutItem(occupied, candidate)) {
        return { x, y };
      }
    }
  }

  return null;
}

function canPlaceLayoutItem(occupied: boolean[][], item: DashboardLayoutItem) {
  if (
    item.x < 0 ||
    item.y < 0 ||
    item.w < 1 ||
    item.h < 1 ||
    item.x + item.w > dashboardGrid.columns ||
    item.y + item.h > dashboardGrid.rows
  ) {
    return false;
  }

  for (let y = item.y; y < item.y + item.h; y += 1) {
    for (let x = item.x; x < item.x + item.w; x += 1) {
      if (occupied[y][x]) return false;
    }
  }

  return true;
}

function placeLayoutItem(occupied: boolean[][], item: DashboardLayoutItem) {
  for (let y = item.y; y < item.y + item.h; y += 1) {
    for (let x = item.x; x < item.x + item.w; x += 1) {
      occupied[y][x] = true;
    }
  }
}
