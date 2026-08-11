import type { DocumentType, UserStatus } from "./auth";

export type PlatformOrganizationStatus =
  | "ACTIVE"
  | "TRIAL"
  | "SUSPENDED"
  | "DISABLED"
  | "ARCHIVED";

export type PlatformUserStatus =
  | "ACTIVE"
  | "INVITED"
  | "SUSPENDED"
  | "DISABLED";

export type PlatformMembershipStatus =
  | "INVITED"
  | "ACTIVE"
  | "SUSPENDED"
  | "INACTIVE"
  | "TERMINATED";

export type PlatformRoleContext = "PLATFORM" | "ORGANIZATION";
export type PlatformPermissionScope =
  | "OWN"
  | "BRANCH"
  | "ORGANIZATION"
  | "PLATFORM";
export type ModuleAudience = "PLATFORM" | "ORGANIZATION" | "BOTH";
export type GlobalUserScope = "PLATFORM" | "OWNER" | "MANAGER";

export type PlatformOrganizationSummary = {
  id: string;
  legalName: string;
  tradeName: string | null;
  slug: string;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  status: PlatformOrganizationStatus;
  moduleKeys: string[];
  activeModules: number;
  activeWorkers: number;
  ownerUserId: string | null;
  ownerName: string | null;
  createdAt: string;
};

export type PlatformUserOrganizationLink = {
  slug: string;
  name: string;
  status: PlatformMembershipStatus;
};

export type PlatformGlobalUserSummary = {
  id: string;
  name: string | null;
  email: string | null;
  identifier: string | null;
  firstName: string | null;
  lastName: string | null;
  documentType: DocumentType | null;
  phone: string | null;
  status: PlatformUserStatus;
  scope: GlobalUserScope;
  platformRoleScopeKeys: string[];
  platformRoleNames: string[];
  platformRolePermissionKeys: string[];
  platformAllowPermissionKeys: string[];
  platformDenyPermissionKeys: string[];
  platformPermissionKeys: string[];
  effectivePermissionKeys: string[];
  memberships: PlatformMembershipSummary[];
  organizations: PlatformUserOrganizationLink[];
};

export type PlatformMembershipSummary = {
  id: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  organizationModuleKeys: string[];
  status: PlatformMembershipStatus;
  title: string | null;
  employeeCode: string | null;
  roleKeys: string[];
  roleScopeKeys: string[];
  roleNames: string[];
  rolePermissionKeys: string[];
  allowPermissionKeys: string[];
  denyPermissionKeys: string[];
  permissionKeys: string[];
};

export type PlatformOrganizationUserSummary = {
  id: string;
  status: PlatformMembershipStatus;
  title: string | null;
  employeeCode: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    documentType: DocumentType | null;
    documentNumber: string | null;
    phone: string | null;
    status: PlatformUserStatus;
  };
  roleScopeKeys: string[];
  roleNames: string[];
  roles: Array<{
    scopeKey: string;
    key: string;
    name: string;
    isSystem: boolean;
  }>;
};

export type PaginatedPlatformResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type PlatformRoleTemplate = {
  id: string;
  scopeKey: string;
  key: string;
  name: string;
  description: string | null;
  context: PlatformRoleContext;
  organizationId?: string | null;
  isSystem?: boolean;
  permissionCount: number;
  permissionKeys: string[];
  memberCount: number;
};

export type PlatformPermissionSummary = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  moduleKey: string | null;
  submoduleKey: string | null;
  scope: PlatformPermissionScope;
  audience: ModuleAudience;
};

export type PlatformSubmoduleSummary = {
  id: string;
  key: string;
  name: string;
  route: string;
  permissionKey: string | null;
  sortOrder: number;
};

export type PlatformModuleSummary = {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  audience: ModuleAudience;
  sortOrder: number;
  summary: string;
  submodules: PlatformSubmoduleSummary[];
};

export type CreatePlatformOrganizationInput = {
  legalName: string;
  tradeName?: string;
  slug?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  status?: PlatformOrganizationStatus;
  ownerUserId?: string;
  moduleKeys?: string[];
};

export type CreatePlatformUserInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  status?: UserStatus;
  organizationId?: string;
  organizationRoleScopeKey?: string;
  platformRoleScopeKey?: string;
};

export type CreatePlatformModuleInput = {
  key: string;
  name: string;
  icon?: string;
  audience: ModuleAudience;
  sortOrder?: number;
};

export type CreatePlatformSubmoduleInput = {
  moduleKey: string;
  key: string;
  name: string;
  route: string;
  permissionKey?: string;
  sortOrder?: number;
};

export type CreatePlatformPermissionInput = {
  key: string;
  name: string;
  description?: string;
  moduleKey?: string;
  submoduleKey?: string;
  scope: PlatformPermissionScope;
  audience: ModuleAudience;
};

export type UpdatePlatformOrganizationInput = Partial<CreatePlatformOrganizationInput>;

export type UpdatePlatformUserInput = {
  email?: string;
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  status?: UserStatus;
  platformRoleScopeKey?: string;
};

export type AssignPlatformMembershipInput = {
  organizationId: string;
  roleScopeKey?: string;
  roleScopeKeys?: string[];
  replaceRoles?: boolean;
  status?: PlatformMembershipStatus;
  title?: string;
  employeeCode?: string;
};

export type UpdatePermissionOverridesInput = {
  allowPermissionKeys?: string[];
  denyPermissionKeys?: string[];
};

export type UpdatePlatformModuleInput = {
  name?: string;
  icon?: string;
  audience?: ModuleAudience;
  sortOrder?: number;
};

export type UpdatePlatformSubmoduleInput = {
  name?: string;
  route?: string;
  permissionKey?: string;
  sortOrder?: number;
};

export type UpdatePlatformPermissionInput = {
  name?: string;
  description?: string;
  moduleKey?: string;
  submoduleKey?: string;
  scope?: PlatformPermissionScope;
  audience?: ModuleAudience;
};

export type UpdatePlatformRoleInput = {
  name?: string;
  description?: string;
  permissionKeys?: string[];
};

export type CreateOrganizationRoleInput = {
  key: string;
  name: string;
  description?: string;
  permissionKeys?: string[];
};
