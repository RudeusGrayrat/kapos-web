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
  CustomerSummary,
  DiningAreaSummary,
  DiningTableSummary,
  KitchenTicketStatus,
  KitchenTicketSummary,
  OpenAccountStatus,
  OpenAccountSummary,
  ServiceType,
  BillingDocumentStatus,
  BillingDocumentSummary,
  BillingProviderConfigSummary,
  BillingSeriesSummary,
  DashboardRange,
  DashboardSummary,
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

export function getDashboard(input: {
  accessToken: string;
  organizationId?: string | null;
  range?: DashboardRange;
}) {
  const params = new URLSearchParams();
  if (input.range) params.set("range", input.range);
  const query = params.toString();

  return apiRequest<DashboardSummary>(
    `/erp/dashboard${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: input.organizationId
        ? organizationHeaders(input.organizationId)
        : undefined,
    },
  );
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

export function deletePaymentMethod(
  input: OrganizationRequestInput & { paymentMethodId: string },
) {
  return apiRequest<{ ok: true }>(
    `/erp/settings/payment-methods/${input.paymentMethodId}`,
    {
      method: "DELETE",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
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
  input: OrganizationRequestInput & { cashRegisterId?: string; branchId?: string },
) {
  const params = new URLSearchParams();

  if (input.cashRegisterId) params.set("cashRegisterId", input.cashRegisterId);
  if (input.branchId) params.set("branchId", input.branchId);

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

export function getDiningAreas(
  input: OrganizationRequestInput & { branchId?: string },
) {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branchId", input.branchId);
  const query = params.toString();
  return apiRequest<DiningAreaSummary[]>(
    `/erp/restaurant/areas${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function createDiningArea(
  input: OrganizationRequestInput & {
    body: { branchId: string; name: string; sortOrder?: number };
  },
) {
  return apiRequest<DiningAreaSummary>("/erp/restaurant/areas", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateDiningArea(
  input: OrganizationRequestInput & {
    areaId: string;
    body: { name?: string; sortOrder?: number; isActive?: boolean };
  },
) {
  return apiRequest<DiningAreaSummary>(`/erp/restaurant/areas/${input.areaId}`, {
    method: "PATCH",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function createDiningTable(
  input: OrganizationRequestInput & {
    body: {
      branchId: string;
      areaId: string;
      code: string;
      name: string;
      capacity?: number;
      sortOrder?: number;
    };
  },
) {
  return apiRequest<DiningTableSummary>("/erp/restaurant/tables", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateDiningTable(
  input: OrganizationRequestInput & {
    tableId: string;
    body: {
      areaId?: string;
      code?: string;
      name?: string;
      capacity?: number;
      sortOrder?: number;
      isActive?: boolean;
    };
  },
) {
  return apiRequest<DiningTableSummary>(`/erp/restaurant/tables/${input.tableId}`, {
    method: "PATCH",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function getOpenAccounts(
  input: OrganizationRequestInput & {
    branchId?: string;
    status?: OpenAccountStatus;
    serviceType?: ServiceType;
    search?: string;
  },
) {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branchId", input.branchId);
  if (input.status) params.set("status", input.status);
  if (input.serviceType) params.set("serviceType", input.serviceType);
  if (input.search?.trim()) params.set("search", input.search.trim());
  const query = params.toString();
  return apiRequest<OpenAccountSummary[]>(
    `/erp/restaurant/accounts${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function getOpenAccount(
  input: OrganizationRequestInput & { accountId: string },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function createOpenAccount(
  input: OrganizationRequestInput & {
    body: {
      branchId: string;
      serviceType: ServiceType;
      diningTableId?: string;
      customerProfileId?: string;
      guestCount?: number;
      customerName?: string;
      customerPhone?: string;
      deliveryAddress?: string;
      deliveryReference?: string;
      note?: string;
    };
  },
) {
  return apiRequest<OpenAccountSummary>("/erp/restaurant/accounts", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateOpenAccount(
  input: OrganizationRequestInput & {
    accountId: string;
    body: {
      expectedVersion: number;
      customerProfileId?: string | null;
      guestCount?: number;
      customerName?: string;
      customerPhone?: string;
      deliveryAddress?: string;
      deliveryReference?: string;
      note?: string;
    };
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}`,
    {
      method: "PATCH",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function addOpenAccountItems(
  input: OrganizationRequestInput & {
    accountId: string;
    body: {
      expectedVersion: number;
      items: Array<{
        productId: string;
        quantity: number;
        discountAmount?: number;
        note?: string;
      }>;
    };
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}/items`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function moveOpenAccountTable(
  input: OrganizationRequestInput & {
    accountId: string;
    body: { expectedVersion: number; diningTableId: string };
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}/table/move`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function joinOpenAccountTable(
  input: OrganizationRequestInput & {
    accountId: string;
    body: { expectedVersion: number; diningTableId: string };
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}/tables`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function releaseOpenAccountTable(
  input: OrganizationRequestInput & {
    accountId: string;
    tableId: string;
    expectedVersion: number;
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}/tables/${input.tableId}/release`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: { expectedVersion: input.expectedVersion },
    },
  );
}

export function generateOpenAccountPrebill(
  input: OrganizationRequestInput & {
    accountId: string;
    expectedVersion: number;
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}/prebill`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: { expectedVersion: input.expectedVersion },
    },
  );
}

export function cancelOpenAccountItem(
  input: OrganizationRequestInput & {
    accountId: string;
    itemId: string;
    body: { expectedVersion: number; reason: string };
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}/items/${input.itemId}/cancel`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function sendOpenAccountToKitchen(
  input: OrganizationRequestInput & {
    accountId: string;
    body: { expectedVersion: number; itemIds?: string[]; note?: string };
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}/kitchen-tickets`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function getKitchenTickets(
  input: OrganizationRequestInput & { branchId?: string; status?: KitchenTicketStatus },
) {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branchId", input.branchId);
  if (input.status) params.set("status", input.status);
  const query = params.toString();
  return apiRequest<KitchenTicketSummary[]>(
    `/erp/restaurant/kitchen-tickets${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function updateKitchenTicket(
  input: OrganizationRequestInput & {
    ticketId: string;
    status: Exclude<KitchenTicketStatus, "DRAFT" | "SENT">;
  },
) {
  return apiRequest<KitchenTicketSummary>(
    `/erp/restaurant/kitchen-tickets/${input.ticketId}`,
    {
      method: "PATCH",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: { status: input.status },
    },
  );
}

export function recordOpenAccountPayment(
  input: OrganizationRequestInput & {
    accountId: string;
    body: {
      expectedVersion: number;
      idempotencyKey: string;
      cashSessionId: string;
      paymentMethodId?: string;
      paymentIntentId?: string;
      amount: number;
      billingDocumentType?: "TICKET" | "BOLETA" | "FACTURA";
      billingRecipient?: {
        documentType?: "DNI" | "RUC" | "CE" | "PASSPORT";
        documentNumber?: string;
        name?: string;
        address?: string;
        email?: string;
      };
      allocations?: Array<{ itemId: string; quantity: number }>;
      provider?: string;
      providerRef?: string;
    };
  },
) {
  return apiRequest<OpenAccountSummary>(
    `/erp/restaurant/accounts/${input.accountId}/payments`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: input.body,
    },
  );
}

export function getCustomers(
  input: OrganizationRequestInput & { page?: number; limit?: number; search?: string },
) {
  const params = new URLSearchParams();
  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  if (input.search?.trim()) params.set("search", input.search.trim());
  const query = params.toString();
  return apiRequest<PaginatedErpResponse<CustomerSummary>>(
    `/erp/customers${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function createCustomer(
  input: OrganizationRequestInput & {
    body: {
      email?: string;
      documentType?: "DNI" | "RUC" | "CE" | "PASSPORT";
      documentNumber?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      externalCustomerCode?: string;
    };
  },
) {
  return apiRequest<CustomerSummary>("/erp/customers", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function getBillingProvider(input: OrganizationRequestInput) {
  return apiRequest<BillingProviderConfigSummary>("/erp/billing/provider", {
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function createBillingProvider(
  input: OrganizationRequestInput & {
    body: Omit<BillingProviderConfigSummary, "provider" | "hasToken" | "configured" | "updatedAt"> & {
      token?: string;
    };
  },
) {
  return apiRequest<BillingProviderConfigSummary>("/erp/billing/provider", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateBillingProvider(
  input: OrganizationRequestInput & {
    body: Omit<BillingProviderConfigSummary, "provider" | "hasToken" | "configured" | "updatedAt"> & {
      token?: string;
    };
  },
) {
  return apiRequest<BillingProviderConfigSummary>("/erp/billing/provider", {
    method: "PATCH",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function activateBillingProvider(input: OrganizationRequestInput) {
  return apiRequest<BillingProviderConfigSummary>("/erp/billing/provider/activate", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function deactivateBillingProvider(input: OrganizationRequestInput) {
  return apiRequest<BillingProviderConfigSummary>("/erp/billing/provider/deactivate", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function deleteBillingProvider(input: OrganizationRequestInput) {
  return apiRequest<{ ok: true }>("/erp/billing/provider", {
    method: "DELETE",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function testBillingProvider(input: OrganizationRequestInput) {
  return apiRequest<{ ok: boolean; remoteChecked: boolean; message: string }>(
    "/erp/billing/provider/test",
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function getBillingSeries(input: OrganizationRequestInput) {
  return apiRequest<BillingSeriesSummary[]>("/erp/billing/series", {
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function upsertBillingSeries(
  input: OrganizationRequestInput & {
    body: Pick<
      BillingSeriesSummary,
      "branchId" | "documentType" | "series" | "nextNumber" | "enabled"
    >;
  },
) {
  return apiRequest<BillingSeriesSummary>("/erp/billing/series", {
    method: "POST",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function updateBillingSeries(
  input: OrganizationRequestInput & {
    seriesId: string;
    body: Pick<
      BillingSeriesSummary,
      "branchId" | "documentType" | "series" | "nextNumber" | "enabled"
    >;
  },
) {
  return apiRequest<BillingSeriesSummary>(`/erp/billing/series/${input.seriesId}`, {
    method: "PATCH",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
    body: input.body,
  });
}

export function deleteBillingSeries(
  input: OrganizationRequestInput & { seriesId: string },
) {
  return apiRequest<{ ok: true }>(`/erp/billing/series/${input.seriesId}`, {
    method: "DELETE",
    accessToken: input.accessToken,
    headers: organizationHeaders(input.organizationId),
  });
}

export function getBillingDocuments(
  input: OrganizationRequestInput & {
    page?: number;
    limit?: number;
    search?: string;
    status?: BillingDocumentStatus;
  },
) {
  const params = new URLSearchParams();
  if (input.page) params.set("page", String(input.page));
  if (input.limit) params.set("limit", String(input.limit));
  if (input.search?.trim()) params.set("search", input.search.trim());
  if (input.status) params.set("status", input.status);
  const query = params.toString();
  return apiRequest<PaginatedErpResponse<BillingDocumentSummary>>(
    `/erp/billing/documents${query ? `?${query}` : ""}`,
    {
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
    },
  );
}

export function issueBillingDocument(
  input: OrganizationRequestInput & {
    documentId: string;
    documentType: "BOLETA" | "FACTURA";
  },
) {
  return apiRequest<BillingDocumentSummary>(
    `/erp/billing/documents/${input.documentId}/issue`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: { documentType: input.documentType },
    },
  );
}

export function issueSaleBillingDocument(
  input: OrganizationRequestInput & {
    saleId: string;
    documentType: "BOLETA" | "FACTURA";
  },
) {
  return apiRequest<BillingDocumentSummary>(
    `/erp/billing/sales/${input.saleId}/issue`,
    {
      method: "POST",
      accessToken: input.accessToken,
      headers: organizationHeaders(input.organizationId),
      body: { documentType: input.documentType },
    },
  );
}
