import type {
  GlobalUserScope,
  ModuleAudience,
  PlatformOrganizationStatus,
  PlatformPermissionScope,
  PlatformRoleContext,
  PlatformUserStatus,
} from "../types/platform-admin";

export function formatOrganizationStatus(status: PlatformOrganizationStatus) {
  switch (status) {
    case "ACTIVE":
      return "Activa";
    case "TRIAL":
      return "Prueba";
    case "SUSPENDED":
      return "Suspendida";
    case "DISABLED":
      return "Deshabilitada";
    case "ARCHIVED":
      return "Archivada";
    default:
      return status;
  }
}

export function formatUserStatus(status: PlatformUserStatus) {
  switch (status) {
    case "ACTIVE":
      return "Activo";
    case "INVITED":
      return "Invitado";
    case "SUSPENDED":
      return "Suspendido";
    case "DISABLED":
      return "Deshabilitado";
    default:
      return status;
  }
}

export function formatGlobalUserScope(scope: GlobalUserScope) {
  switch (scope) {
    case "PLATFORM":
      return "Platform";
    case "OWNER":
      return "Owner";
    case "MANAGER":
      return "Manager";
    default:
      return scope;
  }
}

export function formatRoleContext(context: PlatformRoleContext) {
  return context === "PLATFORM" ? "Platform" : "Organization";
}

export function formatModuleAudience(audience: ModuleAudience) {
  switch (audience) {
    case "PLATFORM":
      return "Platform";
    case "ORGANIZATION":
      return "Organization";
    case "BOTH":
      return "Both";
    default:
      return audience;
  }
}

export function formatPermissionScope(scope: PlatformPermissionScope) {
  switch (scope) {
    case "PLATFORM":
      return "PLATFORM";
    case "ORGANIZATION":
      return "ORGANIZATION";
    case "BRANCH":
      return "BRANCH";
    case "OWN":
      return "OWN";
    default:
      return scope;
  }
}

export function humanizeCatalogKey(value: string | null) {
  if (!value) {
    return "Sin submodulo";
  }

  return value
    .split(".")
    .join(" ")
    .split("-")
    .join(" ")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
