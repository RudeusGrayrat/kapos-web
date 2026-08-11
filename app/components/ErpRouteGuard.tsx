"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminActionButton } from "./admin/AdminActionButton";
import { AdminMessage, PanelCard } from "./admin/AdminBlocks";
import { useAuth } from "../context/auth-context";
import type {
  MembershipAccessSummary,
  NavigationModule,
  PlatformAccessSummary,
} from "../types/auth";

type ErpRouteGuardProps = {
  children: ReactNode;
};

const ALWAYS_ALLOWED_PATHS = new Set(["/dashboard", "/home"]);

function routeMatches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function getAllowedRoutes(
  catalog: NavigationModule[],
  platformContext: PlatformAccessSummary,
  activeOrganization: MembershipAccessSummary | null,
) {
  const platformPermissions = new Set(platformContext?.permissionKeys ?? []);
  const organizationPermissions = new Set(activeOrganization?.permissionKeys ?? []);
  const organizationModules = new Set(activeOrganization?.moduleKeys ?? []);

  return catalog.flatMap((moduleItem) =>
    moduleItem.submodules
      .filter((submodule) => {
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
      })
      .map((submodule) => submodule.route),
  );
}

export function ErpRouteGuard({ children }: ErpRouteGuardProps) {
  const pathname = usePathname();
  const { activeOrganization, navigationCatalog, platformContext } = useAuth();

  if (ALWAYS_ALLOWED_PATHS.has(pathname)) {
    return children;
  }

  const allowedRoutes = getAllowedRoutes(
    navigationCatalog,
    platformContext,
    activeOrganization,
  );
  const canAccessCurrentRoute = allowedRoutes.some((route) =>
    routeMatches(pathname, route),
  );

  if (canAccessCurrentRoute) {
    return children;
  }

  return (
    <PanelCard
      title="Ups, no tienes acceso a esta pantalla"
      description="La ruta existe o fue escrita manualmente, pero no esta dentro de los modulos y permisos activos de tu sesion actual."
    >
      <div className="space-y-5">
        <AdminMessage
          title="Acceso bloqueado"
          description="Si acabas de cambiar memberships o permisos, cierra sesion y vuelve a entrar para tomar el contexto nuevo. Si aun asi aparece, revisa la asignacion del usuario desde Superadmin."
          tone="warn"
        />
        <div className="flex justify-end">
          <Link href="/dashboard">
            <AdminActionButton tone="primary">Volver al dashboard</AdminActionButton>
          </Link>
        </div>
      </div>
    </PanelCard>
  );
}
