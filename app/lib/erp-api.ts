import { apiRequest } from "./api";
import type {
  BranchSummary,
  CashMovementSummary,
  CashRegisterSummary,
  CashSessionSummary,
  CashMovementType,
  InternalRoleSummary,
  InternalUserSummary,
  OrganizationProfile,
  OrganizationPermissionSummary,
  PaginatedErpResponse,
  PaymentMethodSummary,
  ProductCategorySummary,
  ProductStockSummary,
  ProductSummary,
} from "../types/erp";

type OrganizationRequestInput = {
  accessToken: string;
  organizationId: string;
};

function organizationHeaders(organizationId: string) {
  return {
    "x-organization-id": organizationId,
  };
}

export function getOrganizationProfile(input: OrganizationRequestInput) {
  return apiRequest<OrganizationProfile>("/erp/settings/organization", {
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function updateOrganizationProfile(
  input: OrganizationRequestInput & { body: Partial<OrganizationProfile["settings"]> & Partial<OrganizationProfile> },
) {
  return apiRequest<OrganizationProfile>("/erp/settings/organization", {
    method: "PATCH",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function getBranches(input: OrganizationRequestInput) {
  return apiRequest<BranchSummary[]>("/erp/settings/branches", {
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function createBranch(
  input: OrganizationRequestInput & { body: Partial<BranchSummary> },
) {
  return apiRequest<BranchSummary>("/erp/settings/branches", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateBranch(
  input: OrganizationRequestInput & { branchId: string; body: Partial<BranchSummary> },
) {
  return apiRequest<BranchSummary>(`/erp/settings/branches/${input.branchId}`, {
    method: "PATCH",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function getPaymentMethods(input: OrganizationRequestInput) {
  return apiRequest<PaymentMethodSummary[]>("/erp/settings/payment-methods", {
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function createPaymentMethod(
  input: OrganizationRequestInput & { body: Partial<PaymentMethodSummary> },
) {
  return apiRequest<PaymentMethodSummary>("/erp/settings/payment-methods", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updatePaymentMethod(
  input: OrganizationRequestInput & { paymentMethodId: string; body: Partial<PaymentMethodSummary> },
) {
  return apiRequest<PaymentMethodSummary>(
    `/erp/settings/payment-methods/${input.paymentMethodId}`,
    {
      method: "PATCH",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function getProductCategories(input: OrganizationRequestInput) {
  return apiRequest<ProductCategorySummary[]>("/erp/catalog/categories", {
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function createProductCategory(
  input: OrganizationRequestInput & { body: Partial<ProductCategorySummary> },
) {
  return apiRequest<ProductCategorySummary>("/erp/catalog/categories", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateProductCategory(
  input: OrganizationRequestInput & { categoryId: string; body: Partial<ProductCategorySummary> },
) {
  return apiRequest<ProductCategorySummary>(
    `/erp/catalog/categories/${input.categoryId}`,
    {
      method: "PATCH",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function getProducts(
  input: OrganizationRequestInput & { page?: number; limit?: number; search?: string },
) {
  const params = new URLSearchParams();

  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  if (input.search?.trim()) params.set("search", input.search.trim());

  const query = params.toString();

  return apiRequest<PaginatedErpResponse<ProductSummary>>(
    `/erp/catalog/products${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function createProduct(
  input: OrganizationRequestInput & { body: Partial<ProductSummary> },
) {
  return apiRequest<ProductSummary>("/erp/catalog/products", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateProduct(
  input: OrganizationRequestInput & { productId: string; body: Partial<ProductSummary> },
) {
  return apiRequest<ProductSummary>(`/erp/catalog/products/${input.productId}`, {
    method: "PATCH",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function getStock(input: OrganizationRequestInput) {
  return apiRequest<ProductStockSummary[]>("/erp/catalog/stock", {
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function upsertStock(
  input: OrganizationRequestInput & {
    body: { productId: string; branchId: string; quantity: number; minQuantity?: number };
  },
) {
  return apiRequest<ProductStockSummary>("/erp/catalog/stock", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function getCashRegisters(input: OrganizationRequestInput) {
  return apiRequest<CashRegisterSummary[]>("/erp/cash/registers", {
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function createCashRegister(
  input: OrganizationRequestInput & { body: Partial<CashRegisterSummary> },
) {
  return apiRequest<CashRegisterSummary>("/erp/cash/registers", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateCashRegister(
  input: OrganizationRequestInput & { cashRegisterId: string; body: Partial<CashRegisterSummary> },
) {
  return apiRequest<CashRegisterSummary>(
    `/erp/cash/registers/${input.cashRegisterId}`,
    {
      method: "PATCH",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function getCashSessions(
  input: OrganizationRequestInput & {
    page?: number;
    limit?: number;
    search?: string;
    status?: CashSessionSummary["status"];
  },
) {
  const params = new URLSearchParams();

  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  if (input.search?.trim()) params.set("search", input.search.trim());
  if (input.status) params.set("status", input.status);

  const query = params.toString();

  return apiRequest<PaginatedErpResponse<CashSessionSummary>>(
    `/erp/cash/sessions${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function getOpenCashSession(
  input: OrganizationRequestInput & { cashRegisterId?: string },
) {
  const params = new URLSearchParams();

  if (input.cashRegisterId) params.set("cashRegisterId", input.cashRegisterId);

  const query = params.toString();

  return apiRequest<CashSessionSummary | null>(
    `/erp/cash/sessions/open${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function openCashSession(
  input: OrganizationRequestInput & {
    body: {
      branchId: string;
      cashRegisterId: string;
      openingAmount?: number;
      openingNote?: string;
    };
  },
) {
  return apiRequest<CashSessionSummary>("/erp/cash/sessions/open", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function getCashMovements(
  input: OrganizationRequestInput & { cashSessionId: string },
) {
  return apiRequest<CashMovementSummary[]>(
    `/erp/cash/sessions/${input.cashSessionId}/movements`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function createCashMovement(
  input: OrganizationRequestInput & {
    cashSessionId: string;
    body: {
      type: CashMovementType;
      amount: number;
      concept: string;
      paymentMethodId?: string;
      note?: string;
    };
  },
) {
  return apiRequest<CashMovementSummary>(
    `/erp/cash/sessions/${input.cashSessionId}/movements`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function closeCashSession(
  input: OrganizationRequestInput & {
    cashSessionId: string;
    body: { countedAmount: number; closingNote?: string };
  },
) {
  return apiRequest<CashSessionSummary>(
    `/erp/cash/sessions/${input.cashSessionId}/close`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function getInternalUsers(
  input: OrganizationRequestInput & { page?: number; limit?: number; search?: string },
) {
  const params = new URLSearchParams();

  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  if (input.search?.trim()) params.set("search", input.search.trim());

  const query = params.toString();

  return apiRequest<PaginatedErpResponse<InternalUserSummary>>(
    `/erp/access/organization/users${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function createInternalUser(
  input: OrganizationRequestInput & {
    body: {
      email: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      documentType?: InternalUserSummary["user"]["documentType"];
      documentNumber?: string;
      phone?: string;
      title?: string;
      employeeCode?: string;
      membershipStatus?: InternalUserSummary["status"];
      roleScopeKeys?: string[];
    };
  },
) {
  return apiRequest<InternalUserSummary>("/erp/access/organization/users", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateInternalUser(
  input: OrganizationRequestInput & {
    membershipId: string;
    body: {
      email?: string;
      firstName?: string;
      lastName?: string;
      documentType?: InternalUserSummary["user"]["documentType"];
      documentNumber?: string;
      phone?: string;
      title?: string;
      employeeCode?: string;
      membershipStatus?: InternalUserSummary["status"];
      userStatus?: InternalUserSummary["user"]["status"];
      roleScopeKeys?: string[];
    };
  },
) {
  return apiRequest<InternalUserSummary>(
    `/erp/access/organization/users/${input.membershipId}`,
    {
      method: "PATCH",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function suspendInternalUser(
  input: OrganizationRequestInput & { membershipId: string },
) {
  return apiRequest<InternalUserSummary>(
    `/erp/access/organization/users/${input.membershipId}/suspend`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function reactivateInternalUser(
  input: OrganizationRequestInput & { membershipId: string },
) {
  return apiRequest<InternalUserSummary>(
    `/erp/access/organization/users/${input.membershipId}/reactivate`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function getInternalRoles(
  input: OrganizationRequestInput & { page?: number; limit?: number; search?: string },
) {
  const params = new URLSearchParams();

  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  if (input.search?.trim()) params.set("search", input.search.trim());

  const query = params.toString();

  return apiRequest<PaginatedErpResponse<InternalRoleSummary>>(
    `/erp/access/organization/roles${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function getAssignableOrganizationPermissions(input: OrganizationRequestInput) {
  return apiRequest<OrganizationPermissionSummary[]>(
    "/erp/access/organization/permissions",
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function createInternalRole(
  input: OrganizationRequestInput & {
    body: {
      key: string;
      name: string;
      description?: string;
      permissionKeys?: string[];
    };
  },
) {
  return apiRequest<InternalRoleSummary>("/erp/access/organization/roles", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateInternalRole(
  input: OrganizationRequestInput & {
    roleId: string;
    body: {
      name?: string;
      description?: string;
      permissionKeys?: string[];
    };
  },
) {
  return apiRequest<InternalRoleSummary>(
    `/erp/access/organization/roles/${input.roleId}`,
    {
      method: "PATCH",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function archiveInternalRole(
  input: OrganizationRequestInput & { roleId: string },
) {
  return apiRequest<{ ok: true }>(
    `/erp/access/organization/roles/${input.roleId}/archive`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}
