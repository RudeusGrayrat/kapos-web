"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  BarChart3,
  CircleUserRound,
  FileText,
  Grid2x2,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
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
  requiresPlatform?: boolean;
};

const ICONS = {
  logo: (
    <span className="text-2xl font-black tracking-wider text-white">K</span>
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

const SURFACE_COLOR = "#fafafa";

const CATEGORIES: Category[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: ICONS.dashboard,
    items: [
      {
        label: "Vista general",
        path: "/dashboard",
        description: "Resumen ejecutivo y actividad general.",
      },
      {
        label: "Centro de actividad",
        path: "/home",
        description: "Entrada principal de trabajo para el usuario.",
      },
    ],
  },
  {
    key: "rrhh",
    label: "Recursos humanos",
    icon: ICONS.rrhh,
    items: [
      {
        label: "Colaboradores",
        path: "/rrhh/colaboradores",
        description: "Fichas, altas y gestion del personal.",
      },
      {
        label: "Boleta de pagos",
        path: "/rrhh/boletas-pago",
        description: "Planillas, periodos y comprobantes.",
      },
      {
        label: "Asistencia",
        path: "/rrhh/asistencia",
        description: "Marcaciones, faltas y tardanzas.",
      },
    ],
  },
  {
    key: "finance",
    label: "Finanzas",
    icon: ICONS.finance,
    items: [
      {
        label: "Facturacion",
        path: "/finanzas/facturacion",
        description: "Comprobantes y control de emision.",
      },
      {
        label: "Tesoreria",
        path: "/finanzas/tesoreria",
        description: "Caja, bancos y conciliaciones.",
      },
      {
        label: "Reportes",
        path: "/finanzas/reportes",
        description: "Indicadores y cortes financieros.",
      },
    ],
  },
  {
    key: "operations",
    label: "Operaciones",
    icon: ICONS.operations,
    items: [
      {
        label: "Manifiestos",
        path: "/manifiestos",
        description: "Documentacion y salidas operativas.",
      },
      {
        label: "Transportistas",
        path: "/transportistas",
        description: "Unidades, terceros y control de flota.",
      },
      {
        label: "Rutas",
        path: "/operaciones/rutas",
        description: "Planeamiento y seguimiento de rutas.",
      },
    ],
  },
  {
    key: "sales",
    label: "Ventas",
    icon: ICONS.sales,
    items: [
      {
        label: "Clientes",
        path: "/ventas/clientes",
        description: "Base comercial y seguimiento de cuentas.",
      },
      {
        label: "Cotizaciones",
        path: "/ventas/cotizaciones",
        description: "Escenarios de ofertas y oportunidades.",
      },
      {
        label: "Pedidos",
        path: "/ventas/pedidos",
        description: "Pedidos y conversiones comerciales.",
      },
    ],
  },
  {
    key: "settings",
    label: "Configuracion",
    icon: ICONS.settings,
    items: [
      {
        label: "Usuarios",
        path: "/configuracion/usuarios",
        description: "Cuentas internas y accesos.",
      },
      {
        label: "Roles",
        path: "/configuracion/roles",
        description: "Roles y permisos base del sistema.",
      },
      {
        label: "Parametros",
        path: "/configuracion/parametros",
        description: "Ajustes globales del ERP.",
      },
    ],
  },
  {
    key: "platform",
    label: "Superadmin",
    icon: ICONS.platform,
    requiresPlatform: true,
    items: [
      {
        label: "Organizaciones",
        path: "/platform/organizaciones",
        description: "Crear clientes, owners y estado de cada empresa.",
      },
      {
        label: "Usuarios globales",
        path: "/platform/usuarios",
        description: "Identidades maestras y accesos de plataforma.",
      },
      {
        label: "Permisos",
        path: "/platform/permisos",
        description: "Llaves base para plataforma, organizacion y sede.",
      },
      {
        label: "Modulos",
        path: "/platform/modulos",
        description: "Modulos y submodulos listos para crecer sin rehacer la base.",
      },
    ],
  },
];

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
    ) ?? categories[0]
  );
}

export default function SideBar() {
  const { activeOrganization, logout, navigationCatalog, platformContext } =
    useAuth();
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
        : CATEGORIES.filter((category) =>
            ["dashboard", "platform"].includes(category.key)
              ? !category.requiresPlatform || Boolean(platformContext)
              : false,
          ),
    [activeOrganization, navigationCatalog, platformContext],
  );
  const activeCategory = useMemo(
    () => getActiveCategory(pathname, visibleCategories),
    [pathname, visibleCategories],
  );
  const [openedCategoryKey, setOpenedCategoryKey] = useState<string | null>(
    null,
  );

  const visibleCategory =
    visibleCategories.find((category) => category.key === openedCategoryKey) ??
    activeCategory;

  const animatedCategory = openedCategoryKey ? visibleCategory : activeCategory;
  const activeIndex = visibleCategories.findIndex(
    (category) => category.key === animatedCategory.key,
  );

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedCategoryKey(null);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!shellRef.current) {
        return;
      }

      if (!shellRef.current.contains(event.target as Node)) {
        setOpenedCategoryKey(null);
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
    <div
      ref={shellRef}
      className="relative my-6 ml-6 hidden w-20 shrink-0 select-none overflow-visible lg:block"
      style={{ backgroundColor: SURFACE_COLOR }}
    >
      <aside className="absolute left-0 top-0 z-30 flex h-full w-20 flex-col items-center rounded-[40px] bg-zinc-950  py-6 transition-all duration-300 ease-in-out">
        <div className="mb-6 flex h-16 w-full items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-[#b4e610] shadow-inner">
            {ICONS.logo}
          </div>
        </div>

        <nav className="relative flex w-full flex-col space-y-3 overflow-visible">
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
                <div className="h-full w-full rounded-br-[24px] bg-zinc-950" />
              </div>
              <div
                className="pointer-events-none absolute right-0 top-full h-6 w-6"
                style={{ backgroundColor: SURFACE_COLOR }}
              >
                <div className="h-full w-full rounded-tr-[24px] bg-zinc-950" />
              </div>
            </div>
          ) : null}

          {visibleCategories.map((category) => {
            const isRouteActive = activeCategory.key === category.key;
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
                        ? `bg-white text-zinc-950 shadow-[0_4px_15px_rgba(0,0,0,0.15)] ${!openedCategoryKey
                          ? "translate-x-2.5"
                          : "translate-x-0"
                        }`
                        : `rounded-full ${isOpened
                          ? "bg-zinc-800 text-zinc-100"
                          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
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

        <div className="mt-auto w-full flex-col space-y-4">
          <div className="group relative flex h-16 w-full items-center overflow-visible pl-4">
            <HoverTooltip label="Perfil" side="right" />
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-950 shadow-md">
              {ICONS.profile}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="group relative flex h-14 w-full items-center pl-4 text-zinc-500 transition-colors hover:text-white"
          >
            <HoverTooltip label="Salir" side="right" />
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full group-hover:bg-red-800">
              {ICONS.logout}
            </div>
          </button>
        </div>
      </aside>

      <div
        className={`absolute left-25 -top-1 z-20 h-full w-[22rem] overflow-hidden rounded-[36px] border border-[#e7edd7] bg-white p-6 shadow-lg transition-all duration-300 ease-in-out ${openedCategoryKey
            ? "translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-4 opacity-0"
          }`}
      >
        <div className="border-b border-[#e6ecd7] pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[#91aa47]">
                Categoria
              </p>
              <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.04em] text-[#1f280f]">
                {visibleCategory.label}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e2e8d2] bg-white/90 text-[#6d7856] shadow-[0_12px_22px_rgba(17,17,17,0.05)]">
              {visibleCategory.icon}
            </div>
          </div>
          <p className="mt-3 max-w-[16rem] text-xs leading-6 text-[#65724b]">
            Elige una subcategoria para cambiar el contenido central del ERP.
          </p>
        </div>

        <div className="mt-4 max-h-[calc(100%-7rem)] pb-2 space-y-2.5 overflow-y-auto pr-1">
          {visibleCategory.items.map((item) => {
            const isActive = isActivePath(pathname, item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setOpenedCategoryKey(null)}
                className={`group block rounded-[24px] border px-4 py-3.5 transition-all duration-200 ${isActive
                    ? "border-[#21291a] bg-[linear-gradient(135deg,#171717_0%,#20251c_100%)] text-white shadow-lg"
                    : "border-[#e5ebd8] bg-white/80 text-[#263019] shadow-xs hover:border-[#cbe27c] hover:bg-[#fcfff4] hover:shadow-md"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${isActive
                        ? "border-white/10 bg-white/10 text-white"
                        : "border-[#e4ead5] bg-[#f8fbe9] text-[#8bad2c] group-hover:border-[#d5e899] group-hover:bg-[#f2f9d7]"
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
                            : "text-[#99a57a] group-hover:translate-x-0.5 group-hover:text-[#7fa31e]"
                          }`}
                      >
                        ›
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-[0.72rem] leading-5 ${isActive ? "text-white/72" : "text-[#6b7651]"
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
    </div>
  );
}
