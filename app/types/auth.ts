export type DocumentType = "DNI" | "CE" | "PASSPORT";

export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED";

export type AuthUser = {
  id: string;
  email: string | null;
  documentType: DocumentType | null;
  documentNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  documentVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlatformAccessSummary = {
  platformAccessId: string;
  roleKeys: string[];
  permissionKeys: string[];
} | null;

export type MembershipAccessSummary = {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  membershipId: string;
  membershipStatus: "INVITED" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TERMINATED";
  roleKeys: string[];
  permissionKeys: string[];
  branchIds: string[];
  moduleKeys: string[];
};

export type NavigationSubmodule = {
  id: string;
  key: string;
  name: string;
  route: string;
  permissionKey: string | null;
  sortOrder: number;
};

export type NavigationModule = {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  audience: "PLATFORM" | "ORGANIZATION" | "BOTH";
  sortOrder: number;
  submodules: NavigationSubmodule[];
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type ErpAccessSummary = {
  user: AuthUser;
  platformContext: PlatformAccessSummary;
  memberships: MembershipAccessSummary[];
  navigationCatalog: NavigationModule[];
  effectivePermissionKeys: string[];
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type UpdateCurrentUserInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  documentType?: DocumentType | "";
  documentNumber?: string;
};
