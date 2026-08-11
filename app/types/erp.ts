export type OrganizationProfile = {
  id: string;
  slug: string;
  legalName: string;
  tradeName: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  settings: {
    id: string;
    currencyCode: string;
    timezone: string;
    taxRate: number;
    receiptFooter: string | null;
    logoUrl: string | null;
  };
};

export type BranchSummary = {
  id: string;
  code: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "CLOSED";
};

export type PaymentMethodSummary = {
  id: string;
  code: string;
  name: string;
  type: "CASH" | "CARD" | "DIGITAL_WALLET" | "BANK_TRANSFER" | "CREDIT" | "OTHER";
  enabled: boolean;
  sortOrder: number;
};

export type ProductCategorySummary = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  parent?: { id: string; name: string; slug: string } | null;
  _count?: { products: number; children: number };
};

export type ProductSummary = {
  id: string;
  categoryId: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  type: "PRODUCT" | "SERVICE" | "INGREDIENT" | "COMBO";
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  price: number;
  cost: number | null;
  taxRate: number | null;
  trackStock: boolean;
  availableForPos: boolean;
  imageUrl: string | null;
  category?: { id: string; name: string; slug: string } | null;
  stockItems: ProductStockSummary[];
};

export type ProductStockSummary = {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  minQuantity: number;
  status: "OK" | "LOW" | "OUT";
  product?: { id: string; name: string; sku: string | null; status: string };
  branch?: { id: string; name: string; code: string | null };
};

export type CashRegisterSummary = {
  id: string;
  branchId: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  sortOrder: number;
  branch?: { id: string; name: string; code: string | null; status?: string };
  _count?: { sessions: number };
};

export type CashMovementType =
  | "INCOME"
  | "EXPENSE"
  | "WITHDRAWAL"
  | "DEPOSIT"
  | "ADJUSTMENT";

export type CashMovementSummary = {
  id: string;
  cashSessionId: string;
  paymentMethodId: string | null;
  createdByUserId: string;
  type: CashMovementType;
  amount: number;
  concept: string;
  note: string | null;
  occurredAt: string;
  paymentMethod?: { id: string; name: string; code: string; type: string } | null;
  createdBy?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

export type CashSessionSummary = {
  id: string;
  organizationId: string;
  branchId: string;
  cashRegisterId: string;
  openedByUserId: string;
  closedByUserId: string | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  openingAmount: number;
  expectedAmount: number | null;
  countedAmount: number | null;
  differenceAmount: number | null;
  openedAt: string;
  closedAt: string | null;
  openingNote: string | null;
  closingNote: string | null;
  branch?: { id: string; name: string; code: string | null };
  cashRegister?: { id: string; name: string; code: string; status: string };
  openedBy?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  closedBy?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  movements: CashMovementSummary[];
};

export type OrganizationPermissionSummary = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  moduleKey: string | null;
  submoduleKey: string | null;
  scope: "OWN" | "BRANCH" | "ORGANIZATION" | "PLATFORM";
  audience: "PLATFORM" | "ORGANIZATION" | "BOTH";
};

export type InternalRoleSummary = {
  id: string;
  scopeKey: string;
  key: string;
  name: string;
  description: string | null;
  context: "ORGANIZATION";
  organizationId: string | null;
  isSystem: boolean;
  status: "ACTIVE" | "ARCHIVED";
  permissionCount: number;
  memberCount: number;
  permissionKeys: string[];
  permissions: OrganizationPermissionSummary[];
};

export type InternalUserSummary = {
  id: string;
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TERMINATED";
  title: string | null;
  employeeCode: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    documentType: "DNI" | "CE" | "PASSPORT" | null;
    documentNumber: string | null;
    phone: string | null;
    status: "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED";
  };
  roleScopeKeys: string[];
  roles: Array<{
    id: string;
    scopeKey: string;
    key: string;
    name: string;
    organizationId: string | null;
    isSystem: boolean;
    status: "ACTIVE" | "ARCHIVED";
  }>;
  rolePermissionKeys: string[];
  allowPermissionKeys: string[];
  denyPermissionKeys: string[];
  effectivePermissionKeys: string[];
};

export type PaginatedErpResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
