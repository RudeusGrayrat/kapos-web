"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  BarChart3,
  Bell,
  CircleUserRound,
  FileText,
  Grid2x2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useNotifications } from "../context/notifications-context";
import { HoverTooltip } from "./ui/HoverTooltip";
import type {
  MembershipAccessSummary,
  NavigationModule,
  PlatformAccessSummary,
} from "../types/auth";

type SubCategory = {
  label: string;
  path: string;
  description: string;
};

type Category = {
  key: string;
  label: string;
  icon: ReactNode;
  items: SubCategory[];
};

const ICONS = {
  logo: (
    <Image
      src="/brand/kapos-k.svg"
      alt="Kapos"
      width={28}
      height={31}
      className="h-8 w-8 object-contain"
      priority
    />
  ),
  dashboard: (
    <Grid2x2 className="h-5 w-5" strokeWidth={2.2} />
  ),
  "layout-dashboard": (
    <LayoutDashboard className="h-5 w-5" strokeWidth={2.2} />
  ),
  rrhh: (
    <Users className="h-5 w-5" strokeWidth={2.2} />
  ),
  finance: (
    <Banknote className="h-5 w-5" strokeWidth={2.2} />
  ),
  operations: (
    <FileText className="h-5 w-5" strokeWidth={2.2} />
  ),
  sales: (
    <TrendingUp className="h-5 w-5" strokeWidth={2.2} />
  ),
  "shopping-bag": (
    <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />
  ),
  cash: (
    <Wallet className="h-5 w-5" strokeWidth={2.2} />
  ),
  wallet: (
    <Wallet className="h-5 w-5" strokeWidth={2.2} />
  ),
  catalog: (
    <Package className="h-5 w-5" strokeWidth={2.2} />
  ),
  package: (
    <Package className="h-5 w-5" strokeWidth={2.2} />
  ),
  billing: (
    <Receipt className="h-5 w-5" strokeWidth={2.2} />
  ),
  receipt: (
    <Receipt className="h-5 w-5" strokeWidth={2.2} />
  ),
  reports: (
    <BarChart3 className="h-5 w-5" strokeWidth={2.2} />
  ),
  "bar-chart-3": (
    <BarChart3 className="h-5 w-5" strokeWidth={2.2} />
  ),
  truck: (
    <Truck className="h-5 w-5" strokeWidth={2.2} />
  ),
  settings: (
    <Settings className="h-5 w-5" strokeWidth={2.2} />
  ),
  platform: (
    <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
  ),
  profile: (
    <CircleUserRound className="h-5 w-5" strokeWidth={2.2} />
  ),
  logout: (
    <LogOut className="h-5 w-5" strokeWidth={2.2} />
  ),
} satisfies Record<string, ReactNode>;

const SURFACE_COLOR = "var(--kapos-background)";

function describeSubcategory(moduleName: string, submoduleName: string) {
  return `${submoduleName} dentro de ${moduleName}.`;
}

function mapNavigationModuleToCategory(moduleItem: NavigationModule): Category {
  return {
    key: moduleItem.key,
    label: moduleItem.name,
    icon: resolveModuleIcon(moduleItem.key, moduleItem.icon),
    items: moduleItem.submodules.map((submodule) => ({
      label: submodule.name,
      path: submodule.route,
      description: describeSubcategory(moduleItem.name, submodule.name),
    })),
  };
}

function filterCatalogByActiveContext(
  catalog: NavigationModule[],
  platformContext: PlatformAccessSummary,
  activeOrganization: MembershipAccessSummary | null,
) {
  const platformPermissions = new Set(platformContext?.permissionKeys ?? []);
  const organizationPermissions = new Set(activeOrganization?.permissionKeys ?? []);
  const organizationModules = new Set(activeOrganization?.moduleKeys ?? []);

  return catalog
    .filter((moduleItem) => moduleItem.key !== "dashboard")
    .map((moduleItem) => {
      const filteredSubmodules = moduleItem.submodules.filter((submodule) => {
        if (
          moduleItem.audience === "ORGANIZATION" &&
          !organizationModules.has(moduleItem.key)
        ) {
          return false;
        }

        if (
          moduleItem.audience === "BOTH" &&
          !platformContext &&
          !organizationModules.has(moduleItem.key)
        ) {
          return false;
        }

        if (!submodule.permissionKey) {
          return true;
        }

        if (moduleItem.audience === "PLATFORM") {
          return platformPermissions.has(submodule.permissionKey);
        }

        if (moduleItem.audience === "ORGANIZATION") {
          return organizationPermissions.has(submodule.permissionKey);
        }

        return (
          platformPermissions.has(submodule.permissionKey) ||
          organizationPermissions.has(submodule.permissionKey)
        );
      });

      return {
        ...moduleItem,
        submodules: filteredSubmodules,
      };
    })
    .filter((moduleItem) => moduleItem.submodules.length > 0);
}

function resolveModuleIcon(moduleKey: string, iconKey: string | null) {
  if (iconKey && iconKey in ICONS) {
    return ICONS[iconKey as keyof typeof ICONS];
  }

  if (moduleKey in ICONS) {
    return ICONS[moduleKey as keyof typeof ICONS];
  }

  return ICONS.settings;
}

function isActivePath(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function getActiveCategory(pathname: string, categories: Category[]) {
  return (
    categories.find((category) =>
      category.items.some((item) => isActivePath(pathname, item.path)),
    ) ?? null
  );
}

export default function SideBar() {
  const { activeOrganization, logout, navigationCatalog, platformContext } =
    useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const visibleCategories = useMemo(
    () =>
      navigationCatalog.length > 0
        ? filterCatalogByActiveContext(
            navigationCatalog,
            platformContext,
            activeOrganization,
          ).map(mapNavigationModuleToCategory)
        : [],
    [activeOrganization, navigationCatalog, platformContext],
  );
  const activeCategory = useMemo(
    () => getActiveCategory(pathname, visibleCategories),
    [pathname, visibleCategories],
  );
  const [openedCategoryKey, setOpenedCategoryKey] = useState<string | null>(
    null,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const visibleCategory =
    visibleCategories.find((category) => category.key === openedCategoryKey) ??
    activeCategory;

  const animatedCategory = openedCategoryKey ? visibleCategory : activeCategory;
  const activeIndex = animatedCategory
    ? visibleCategories.findIndex(
        (category) => category.key === animatedCategory.key,
      )
    : -1;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedCategoryKey(null);
        setIsMobileMenuOpen(false);
        setIsQuickMenuOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!shellRef.current) {
        return;
      }

      if (!shellRef.current.contains(event.target as Node)) {
        setOpenedCategoryKey(null);
        setIsQuickMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-[90] grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[var(--kapos-black)] text-white shadow-lg lg:hidden"
        aria-label="Abrir menu del ERP"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menu"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[min(22rem,calc(100%-2.5rem))] flex-col bg-[linear-gradient(180deg,#050505_0%,var(--kapos-black)_100%)] px-5 py-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-lg font-black">
                {ICONS.logo}<span>Kapos</span>
              </Link>
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10" aria-label="Cerrar menu"><X className="h-5 w-5" /></button>
            </div>
            <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto py-6 pr-1">
              {visibleCategories.map((category) => (
                <section key={category.key}>
                  <div className="flex items-center gap-3 px-2 text-sm font-black text-[#c8ff5e]">{category.icon}<span>{category.label}</span></div>
                  <div className="mt-3 space-y-1">
                    {category.items.map((item) => {
                      const isActive = isActivePath(pathname, item.path);
                      return <Link key={item.path} href={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`block rounded-xl px-4 py-3 text-sm transition ${isActive ? "bg-white text-[var(--kapos-black)] font-bold" : "text-white/72 hover:bg-white/10 hover:text-white"}`}>{item.label}</Link>;
                    })}
                  </div>
                </section>
              ))}
            </nav>
            <div className="flex gap-2 border-t border-white/10 pt-5">
              <Link href="/notificaciones" onClick={() => setIsMobileMenuOpen(false)} className="relative grid h-11 w-11 place-items-center rounded-xl bg-[#c8ff5e] text-[var(--kapos-black)]" aria-label="Ver notificaciones"><Bell className="h-5 w-5" />{unreadCount > 0 ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[var(--kapos-danger)] px-1 text-[0.65rem] font-black leading-none text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}</Link>
              <Link href="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-center text-sm font-bold">Perfil</Link>
              <button type="button" onClick={() => void handleLogout()} className="rounded-xl px-4 py-3 text-sm font-bold text-white/70 hover:bg-red-500 hover:text-white">Salir</button>
            </div>
          </aside>
        </div>
      ) : null}

    <div
      ref={shellRef}
      className="relative my-6 ml-6 hidden w-20 shrink-0 select-none overflow-visible lg:block"
      style={{ backgroundColor: SURFACE_COLOR }}
    >
      <aside className="absolute left-0 top-0 z-30 flex h-full w-20 flex-col items-center rounded-[40px] bg-[linear-gradient(180deg,#050505_0%,var(--kapos-black)_100%)] py-6 transition-all duration-300 ease-in-out">
        <div className="mb-6 flex h-16 w-full items-center justify-center">
          <Link
            href="/dashboard"
            aria-label="Ir al dashboard"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white  transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--kapos-lime)] focus:ring-offset-2 focus:ring-offset-[var(--kapos-black)]"
            onClick={() => setOpenedCategoryKey(null)}
          >
            {ICONS.logo}
          </Link>
        </div>

        <nav className="relative flex w-full flex-col space-y-3 overflow-visible">
          {visibleCategories.length === 0 ? (
            <div className="mx-auto mt-2 w-12 rounded-[18px] border border-white/10 bg-white/5 px-2 py-4 text-center text-[0.62rem] font-semibold leading-4 text-white/58">
              Cargando
            </div>
          ) : null}

          {activeIndex !== -1 ? (
            <div
              className="absolute left-3 right-0 z-0 h-16 rounded-l-[32px] transition-all duration-300 ease-in-out"
              style={{
                backgroundColor: SURFACE_COLOR,
                transform: `translateY(${activeIndex * 76}px)`,
                top: 0,
              }}
            >
              <div
                className="pointer-events-none absolute bottom-full right-0 h-6 w-6"
                style={{ backgroundColor: SURFACE_COLOR }}
              >
                <div className="h-full w-full rounded-br-[24px] bg-[var(--kapos-black)]" />
              </div>
              <div
                className="pointer-events-none absolute right-0 top-full h-6 w-6"
                style={{ backgroundColor: SURFACE_COLOR }}
              >
                <div className="h-full w-full rounded-tr-[24px] bg-[var(--kapos-black)]" />
              </div>
            </div>
          ) : null}

          {visibleCategories.map((category) => {
            const isRouteActive = activeCategory?.key === category.key;
            const isOpened = openedCategoryKey === category.key;

            return (
              <button
                key={category.key}
                type="button"
                onClick={() =>
                  setOpenedCategoryKey((current) =>
                    current === category.key ? null : category.key,
                  )
                }
                className="group relative flex h-16 w-full items-center overflow-visible"
                aria-label={`Abrir categoria ${category.label}`}
              >
                <HoverTooltip label={category.label} side="right" />
                <div className="relative z-10 flex h-full w-full items-center pl-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-in-out ${isRouteActive
                        ? `bg-[var(--kapos-card)] text-[var(--kapos-black)]  shadow-md  ${!openedCategoryKey
                          ? "translate-x-2.5"
                          : "translate-x-0"
                        }`
                        : `rounded-full ${isOpened
                          ? "bg-[var(--kapos-charcoal)] text-white"
                          : "text-[var(--kapos-text-muted)] hover:bg-[var(--kapos-charcoal)] hover:text-white"
                        }`
                      }`}
                  >
                    {category.icon}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="relative mt-auto w-full flex-col space-y-4">
          {isQuickMenuOpen ? (
            <div className="absolute bottom-0 left-24 z-40 flex items-center gap-3 rounded-full border border-[var(--kapos-border)] bg-[var(--kapos-card)] p-2 shadow-[0_18px_42px_rgba(12,13,15,.18)]">
              <Link href="/notificaciones" onClick={() => setIsQuickMenuOpen(false)} className="group relative grid h-12 w-12 place-items-center rounded-full bg-[var(--kapos-green-wash)] text-[var(--kapos-green-dark)] transition hover:bg-[var(--kapos-green)] hover:text-white" aria-label="Ver notificaciones"><Bell className="h-5 w-5" />{unreadCount > 0 ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[var(--kapos-danger)] px-1 text-[0.65rem] font-black leading-none text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}</Link>
              <Link href="/perfil" onClick={() => setIsQuickMenuOpen(false)} className="grid h-12 w-12 place-items-center rounded-full bg-[var(--kapos-black)] text-white transition hover:bg-[var(--kapos-charcoal)]" aria-label="Ir a mi perfil">{ICONS.profile}</Link>
              <button type="button" onClick={() => void handleLogout()} className="grid h-12 w-12 place-items-center rounded-full text-[var(--kapos-text-muted)] transition hover:bg-[var(--kapos-danger)] hover:text-white" aria-label="Cerrar sesion">{ICONS.logout}</button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsQuickMenuOpen((current) => !current)}
            className="group relative flex h-16 w-full items-center overflow-visible pl-4 text-[var(--kapos-text-muted)] transition-colors hover:text-white"
            aria-label={isQuickMenuOpen ? "Cerrar menu rapido" : "Abrir menu rapido"}
          >
            <HoverTooltip label="Mas opciones" side="right" />
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition ${isQuickMenuOpen ? "bg-[var(--kapos-card)] text-[var(--kapos-black)]" : "group-hover:bg-[var(--kapos-charcoal)]"}`}>
              <MoreHorizontal className="h-5 w-5" />
            </div>
          </button>
        </div>
      </aside>

      {visibleCategory ? (
        <div
        className={`absolute left-25 -top-1 z-20 h-full w-[22rem] overflow-hidden rounded-[36px] border border-[var(--kapos-border)] bg-[var(--kapos-card)] p-6 shadow-lg transition-all duration-300 ease-in-out ${openedCategoryKey
            ? "translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-4 opacity-0"
          }`}
      >
        <div className="border-b border-[var(--kapos-border)] pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[var(--kapos-success)]">
                Categoria
              </p>
              <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--kapos-text)]">
                {visibleCategory.label}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--kapos-border)] bg-white/90 text-[var(--kapos-text-soft)] shadow-[0_12px_22px_rgba(12,13,15,0.05)]">
              {visibleCategory.icon}
            </div>
          </div>
          <p className="mt-3 max-w-[16rem] text-xs leading-6 text-[var(--kapos-text-soft)]">
            Elige una subcategoria para cambiar el contenido central del ERP.
          </p>
        </div>

        <div className="mt-4 max-h-[calc(100%-9rem)] pb-2 space-y-2.5 overflow-y-auto pr-1">
          {visibleCategory.items.map((item) => {
            const isActive = isActivePath(pathname, item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setOpenedCategoryKey(null)}
                className={`group block rounded-[20px] border px-4 py-3.5 transition-all duration-200 ${isActive
                    ? "border-[var(--kapos-charcoal)] bg-[linear-gradient(135deg,var(--kapos-black)_0%,var(--kapos-charcoal)_100%)] text-white shadow-lg"
                    : "border-[var(--kapos-border)] bg-white/88 text-[var(--kapos-text)] shadow-xs hover:border-[color-mix(in_srgb,var(--kapos-green)_24%,white)] hover:bg-[var(--kapos-green-wash)] hover:shadow-md"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${isActive
                        ? "border-white/10 bg-white/10 text-white"
                        : "border-[var(--kapos-border)] bg-[var(--kapos-green-wash)] text-[var(--kapos-success)] group-hover:border-[color-mix(in_srgb,var(--kapos-green)_24%,white)] group-hover:bg-[color-mix(in_srgb,var(--kapos-green)_16%,white)]"
                      }`}
                  >
                    <span className="text-sm font-semibold">
                      {item.label.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.95rem] font-semibold leading-5">{item.label}</p>
                      <span
                        className={`text-sm transition ${isActive
                            ? "text-white/70"
                            : "text-[var(--kapos-text-muted)] group-hover:translate-x-0.5 group-hover:text-[var(--kapos-success)]"
                          }`}
                      >
                        ›
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-[0.72rem] leading-5 ${isActive ? "text-white/72" : "text-[var(--kapos-text-soft)]"
                        }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        </div>
      ) : null}
    </div>
    </>
  );
}
