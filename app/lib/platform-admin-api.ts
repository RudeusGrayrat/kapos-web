import { apiRequest } from "./api";
import type {
  AssignPlatformMembershipInput,
  CreateOrganizationRoleInput,
  CreatePlatformModuleInput,
  CreatePlatformOrganizationInput,
  CreatePlatformPermissionInput,
  CreatePlatformSubmoduleInput,
  CreatePlatformUserInput,
  PaginatedPlatformResponse,
  PlatformGlobalUserSummary,
  PlatformOrganizationUserSummary,
  PlatformModuleSummary,
  PlatformOrganizationSummary,
  PlatformPermissionSummary,
  PlatformRoleTemplate,
  UpdatePlatformModuleInput,
  UpdatePlatformOrganizationInput,
  UpdatePlatformPermissionInput,
  UpdatePlatformRoleInput,
  UpdatePlatformSubmoduleInput,
  UpdatePlatformUserInput,
  UpdatePermissionOverridesInput,
} from "../types/platform-admin";

export function getPlatformOrganizations(accessToken: string) {
  return apiRequest<PlatformOrganizationSummary[]>("/erp/access/platform/organizations", {
    method: "GET",
    accessToken,
  });
}

export function getPlatformUsers(
  accessToken: string,
  input?: { page?: number; limit?: number; search?: string },
) {
  const params = new URLSearchParams();

  if (input?.page) {
    params.set("page", String(input.page));
  }

  if (input?.limit) {
    params.set("limit", String(input.limit));
  }

  if (input?.search?.trim()) {
    params.set("search", input.search.trim());
  }

  const query = params.toString();

  return apiRequest<PaginatedPlatformResponse<PlatformGlobalUserSummary>>(
    `/erp/access/platform/users${query ? `?${query}` : ""}`,
    {
    method: "GET",
    accessToken,
    },
  );
}

export function getPlatformRoles(accessToken: string) {
  return apiRequest<PlatformRoleTemplate[]>("/erp/access/platform/roles", {
    method: "GET",
    accessToken,
  });
}

export function getOrganizationRoles(accessToken: string, organizationId: string) {
  return apiRequest<PlatformRoleTemplate[]>(
    `/erp/access/platform/organizations/${organizationId}/roles`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function getPlatformOrganizationUsers(
  accessToken: string,
  organizationId: string,
  input?: { page?: number; limit?: number; search?: string },
) {
  const params = new URLSearchParams();

  if (input?.page) {
    params.set("page", String(input.page));
  }

  if (input?.limit) {
    params.set("limit", String(input.limit));
  }

  if (input?.search?.trim()) {
    params.set("search", input.search.trim());
  }

  const query = params.toString();

  return apiRequest<PaginatedPlatformResponse<PlatformOrganizationUserSummary>>(
    `/erp/access/platform/organizations/${organizationId}/users${query ? `?${query}` : ""}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function getPlatformModules(accessToken: string) {
  return apiRequest<PlatformModuleSummary[]>("/erp/access/platform/modules", {
    method: "GET",
    accessToken,
  });
}

export function getPlatformPermissions(accessToken: string) {
  return apiRequest<PlatformPermissionSummary[]>("/erp/access/platform/permissions", {
    method: "GET",
    accessToken,
  });
}

export function createPlatformOrganization(
  accessToken: string,
  input: CreatePlatformOrganizationInput,
) {
  return apiRequest<PlatformOrganizationSummary>("/erp/access/platform/organizations", {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updatePlatformOrganization(
  accessToken: string,
  organizationId: string,
  input: UpdatePlatformOrganizationInput,
) {
  return apiRequest<PlatformOrganizationSummary>(
    `/erp/access/platform/organizations/${organizationId}`,
    {
      method: "PATCH",
      accessToken,
      body: input,
    },
  );
}

export function createPlatformUser(accessToken: string, input: CreatePlatformUserInput) {
  return apiRequest("/erp/access/platform/users", {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updatePlatformUser(
  accessToken: string,
  userId: string,
  input: UpdatePlatformUserInput,
) {
  return apiRequest(`/erp/access/platform/users/${userId}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function assignPlatformMembership(
  accessToken: string,
  userId: string,
  input: AssignPlatformMembershipInput,
) {
  return apiRequest(`/erp/access/platform/users/${userId}/memberships`, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updatePlatformPermissionOverrides(
  accessToken: string,
  userId: string,
  input: UpdatePermissionOverridesInput,
) {
  return apiRequest(`/erp/access/platform/users/${userId}/platform-permissions`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function updateMembershipPermissionOverrides(
  accessToken: string,
  userId: string,
  membershipId: string,
  input: UpdatePermissionOverridesInput,
) {
  return apiRequest(
    `/erp/access/platform/users/${userId}/memberships/${membershipId}/permissions`,
    {
      method: "PATCH",
      accessToken,
      body: input,
    },
  );
}

export function unlinkPlatformMembership(
  accessToken: string,
  userId: string,
  membershipId: string,
) {
  return apiRequest(
    `/erp/access/platform/users/${userId}/memberships/${membershipId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
}

export function createPlatformModule(
  accessToken: string,
  input: CreatePlatformModuleInput,
) {
  return apiRequest("/erp/access/platform/modules", {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updatePlatformModule(
  accessToken: string,
  moduleId: string,
  input: UpdatePlatformModuleInput,
) {
  return apiRequest(`/erp/access/platform/modules/${moduleId}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function createPlatformSubmodule(
  accessToken: string,
  input: CreatePlatformSubmoduleInput,
) {
  return apiRequest("/erp/access/platform/submodules", {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updatePlatformSubmodule(
  accessToken: string,
  submoduleId: string,
  input: UpdatePlatformSubmoduleInput,
) {
  return apiRequest(`/erp/access/platform/submodules/${submoduleId}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function createPlatformPermission(
  accessToken: string,
  input: CreatePlatformPermissionInput,
) {
  return apiRequest("/erp/access/platform/permissions", {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updatePlatformPermission(
  accessToken: string,
  permissionId: string,
  input: UpdatePlatformPermissionInput,
) {
  return apiRequest(`/erp/access/platform/permissions/${permissionId}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function updatePlatformRole(
  accessToken: string,
  roleId: string,
  input: UpdatePlatformRoleInput,
) {
  return apiRequest(`/erp/access/platform/roles/${roleId}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function createOrganizationRole(
  accessToken: string,
  organizationId: string,
  input: CreateOrganizationRoleInput,
) {
  return apiRequest<PlatformRoleTemplate>(
    `/erp/access/platform/organizations/${organizationId}/roles`,
    {
      method: "POST",
      accessToken,
      body: input,
    },
  );
}

export function updateOrganizationRole(
  accessToken: string,
  organizationId: string,
  roleId: string,
  input: UpdatePlatformRoleInput,
) {
  return apiRequest<PlatformRoleTemplate>(
    `/erp/access/platform/organizations/${organizationId}/roles/${roleId}`,
    {
      method: "PATCH",
      accessToken,
      body: input,
    },
  );
}
