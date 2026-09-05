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

export type UploadedAssetSummary = {
  path: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type ProductStockSummary = {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minQuantity: number;
  status: "OK" | "LOW" | "OUT";
  product?: { id: string; name: string; sku: string | null; status: string };
  branch?: { id: string; name: string; code: string | null };
};

export type StockMovementSummary = {
  id: string;
  organizationId: string;
  branchId: string;
  productId: string;
  saleId: string | null;
  createdByUserId: string;
  type: "SALE" | "SALE_CANCEL" | "ADJUSTMENT";
  quantity: number;
  balanceAfter: number;
  note: string | null;
  occurredAt: string;
  product?: { id: string; name: string; sku: string | null };
  branch?: { id: string; name: string; code: string | null };
  createdBy?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
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
    documentType: "DNI" | "RUC" | "CE" | "PASSPORT" | null;
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

export type OpenAccountStatus = "OPEN" | "PARTIALLY_PAID" | "CLOSED" | "CANCELLED";
export type ServiceType = "LOCAL" | "DELIVERY" | "TAKEAWAY";
export type KitchenTicketStatus =
  | "DRAFT"
  | "SENT"
  | "IN_PREPARATION"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type DiningTableSummary = {
  id: string;
  organizationId: string;
  branchId: string;
  areaId: string;
  code: string;
  name: string;
  capacity: number;
  sortOrder: number;
  isActive: boolean;
  activeAccount: Pick<
    OpenAccountSummary,
    "id" | "accountNumber" | "status" | "total" | "paidTotal" | "balance" | "openedAt"
  > | null;
};

export type DiningAreaSummary = {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  branch: { id: string; name: string; code: string | null };
  tables: DiningTableSummary[];
};

export type OpenAccountItemSummary = {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  note: string | null;
  status: "ACTIVE" | "CANCELLED";
  stockReserved: boolean;
  cancellationReason: string | null;
  cancelledAt: string | null;
  paidQuantity: number;
  remainingQuantity: number;
  kitchenTicketId: string | null;
  kitchenTicket?: { id: string; sequence: number; status: KitchenTicketStatus } | null;
};

export type KitchenTicketSummary = {
  id: string;
  sequence: number;
  status: KitchenTicketStatus;
  note: string | null;
  sentAt: string;
  startedAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
  openAccount?: {
    id: string;
    accountNumber: string;
    serviceType: ServiceType;
    diningTable: { id: string; name: string; code: string } | null;
  };
  items: OpenAccountItemSummary[];
};

export type OpenAccountPaymentAllocationSummary = {
  openAccountItemId: string;
  quantity: number;
  amount: number;
};

export type OpenAccountPaymentSummary = {
  id: string;
  amount: number;
  status: "CONFIRMED" | "CANCELLED";
  provider: string | null;
  providerRef: string | null;
  createdAt: string;
  allocations?: OpenAccountPaymentAllocationSummary[];
  paymentMethod?: Pick<PaymentMethodSummary, "id" | "code" | "name" | "type"> | null;
};

export type OpenAccountSummary = {
  id: string;
  organizationId: string;
  branchId: string;
  diningTableId: string | null;
  customerProfileId: string | null;
  cashSessionId: string | null;
  saleId: string | null;
  accountNumber: string;
  serviceType: ServiceType;
  status: OpenAccountStatus;
  version: number;
  guestCount: number | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  deliveryReference: string | null;
  note: string | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  paidTotal: number;
  balance: number;
  openedAt: string;
  closedAt: string | null;
  prebillGeneratedAt: string | null;
  updatedAt: string;
  branch?: { id: string; name: string; code: string | null };
  diningTable?: {
    id: string;
    code: string;
    name: string;
    area: { id: string; name: string };
  } | null;
  tableLinks?: Array<{
    id: string;
    diningTableId: string;
    assignedAt: string;
    diningTable: {
      id: string;
      code: string;
      name: string;
      area: { id: string; name: string };
    };
  }>;
  customerProfile?: {
    id: string;
    externalCustomerCode: string | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
    };
  } | null;
  items?: OpenAccountItemSummary[];
  kitchenTickets?: KitchenTicketSummary[];
  payments?: OpenAccountPaymentSummary[];
  sale?: {
    id: string;
    saleNumber: string;
    status: string;
    billingDocuments?: Array<Pick<BillingDocumentSummary, "id" | "type" | "status" | "pdfUrl">>;
  } | null;
  _count?: { items: number; kitchenTickets: number; payments: number };
};

export type CustomerSummary = {
  id: string;
  externalCustomerCode: string | null;
  loyaltyTier: string | null;
  status: "ACTIVE" | "BLOCKED" | "ARCHIVED";
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    documentType: "DNI" | "RUC" | "CE" | "PASSPORT" | null;
    documentNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    status: string;
  };
  loyaltyWallet: {
    redeemablePoints: number;
    lifetimePoints: number;
  } | null;
};

export type PaginatedErpResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type BillingProviderConfigSummary = {
  provider: string;
  environment: "TEST" | "PRODUCTION";
  baseUrl: string;
  endpoint: string;
  authorizationScheme: "BEARER" | "RAW" | "TOKEN";
  pdfFormat: "TICKET" | "A4";
  enabled: boolean;
  hasToken: boolean;
  configured: boolean;
  updatedAt: string | null;
};

export type BillingSeriesSummary = {
  id: string;
  branchId: string;
  documentType: "BOLETA" | "FACTURA" | "NOTA_CREDITO" | "NOTA_DEBITO";
  series: string;
  nextNumber: number;
  enabled: boolean;
  branch: { id: string; name: string; code: string | null };
};

export type BillingDocumentType =
  | "TICKET"
  | "BOLETA"
  | "FACTURA"
  | "NOTA_CREDITO"
  | "NOTA_DEBITO";

export type BillingDocumentStatus =
  | "PENDING"
  | "ISSUING"
  | "BILLED"
  | "FAILED"
  | "CANCELLED";

export type BillingDocumentSummary = {
  id: string;
  type: BillingDocumentType;
  affectedDocumentId: string | null;
  status: BillingDocumentStatus;
  recipientDocumentType: "DNI" | "RUC" | "CE" | "PASSPORT" | null;
  recipientDocumentNumber: string | null;
  recipientName: string | null;
  recipientAddress: string | null;
  recipientEmail: string | null;
  provider: string | null;
  externalId: string | null;
  series: string | null;
  number: string | null;
  pdfUrl: string | null;
  xmlUrl: string | null;
  cdrUrl: string | null;
  errorMessage: string | null;
  rawResponse?: unknown;
  noteCode: string | null;
  noteReason: string | null;
  reversesSale: boolean;
  issuedAt: string | null;
  createdAt: string;
  affectedDocument?: Pick<BillingDocumentSummary, "id" | "type" | "series" | "number" | "status"> | null;
  adjustmentDocuments?: Array<Pick<BillingDocumentSummary, "id" | "type" | "series" | "number" | "status" | "issuedAt">>;
  sale: {
    id: string;
    saleNumber: string;
    total: number;
    soldAt: string;
    status: string;
    items?: Array<{
      id: string;
      productName: string;
      quantity: number;
      total: number;
    }>;
    branch: { id: string; name: string };
    customerProfile: {
      id: string;
      user: {
        firstName: string | null;
        lastName: string | null;
        documentType: "DNI" | "RUC" | "CE" | "PASSPORT" | null;
        documentNumber: string | null;
      };
    } | null;
  };
};

export type ExpenseSummary = CashMovementSummary & {
  cashSession?: {
    id: string;
    branch: { id: string; name: string; code: string | null };
    cashRegister: { id: string; name: string; code: string };
  };
};

export type ProfitabilitySummary = {
  range: { from: string; to: string };
  summary: {
    salesTotal: number;
    productCostTotal: number;
    expenseTotal: number;
    grossProfit: number;
    netProfit: number;
    marginPercent: number;
    saleCount: number;
    expenseCount: number;
  };
  daily: Array<{
    date: string;
    sales: number;
    costs: number;
    expenses: number;
    profit: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    sales: number;
    cost: number;
    profit: number;
  }>;
};

export type DashboardRange = "today" | "last_7_days" | "last_30_days";
export type DashboardScope = "PLATFORM" | "ORGANIZATION";
export type DashboardTone = "accent" | "dark" | "soft" | "warn" | "danger";

export type DashboardWidgetDefinition = {
  key: string;
  moduleKey: string;
  title: string;
  description: string;
  requiredAnyPermissionPrefix: string[];
  defaultSize: "sm" | "md" | "lg";
};

export type DashboardLayoutItem = {
  key: string;
  type: "widget" | "shortcut";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DashboardMetricWidget = {
  key: string;
  type: "metric";
  moduleKey: string;
  title: string;
  value: string;
  hint: string;
  tone: DashboardTone;
  trend?: number | null;
};

export type DashboardListWidget = {
  key: string;
  type: "list";
  moduleKey: string;
  title: string;
  hint: string;
  tone: DashboardTone;
  items: Array<{
    id: string;
    label: string;
    value: string;
    meta?: string;
    tone?: DashboardTone;
  }>;
};

export type DashboardChartWidget = {
  key: string;
  type: "chart";
  moduleKey: string;
  title: string;
  hint: string;
  tone: DashboardTone;
  data: Array<{ label: string; value: number }>;
};

export type DashboardWidget =
  | DashboardMetricWidget
  | DashboardListWidget
  | DashboardChartWidget;

export type DashboardShortcut = {
  key: string;
  label: string;
  route: string;
  moduleKey: string;
  permissionKey: string | null;
};

export type DashboardNotification = {
  key: string;
  title: string;
  description: string;
  tone: DashboardTone;
  route?: string;
};

export type PaymentProviderConfigSummary = {
  provider: string;
  environment: "TEST" | "PRODUCTION";
  merchantCode: string;
  facilitatorCode: string | null;
  enabled: boolean;
  hasApiKey: boolean;
  configured: boolean;
  updatedAt: string | null;
};

export type FinancialPlanningSummary = {
  branchId: string;
  plan: {
    id: string;
    monthlySalesTarget: number;
    dailyConsumptionTarget: number | null;
    alertThresholdPercent: number;
  } | null;
  recurringExpenses: Array<{
    id: string;
    name: string;
    amount: number;
    frequency: "MONTHLY";
    startsOn: string;
    endsOn: string | null;
    enabled: boolean;
  }>;
  summary: {
    recurringExpenseTotal: number;
    salesTotal: number;
    productCostTotal: number;
    contributionMarginPercent: number;
    consumptionCount: number;
    recommendedMonthlySalesTarget: number;
    effectiveMonthlySalesTarget: number;
    expectedSalesToDate: number;
    targetProgressPercent: number;
    isBelowExpectedPace: boolean;
  };
};

export type ErpNotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

export type ErpNotificationSummary = {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  eventKey: string;
  audience: "ORGANIZATION" | "BRANCH" | "PERMISSION" | "INDIVIDUAL" | "SYSTEM";
  severity: ErpNotificationSeverity;
  moduleKey: string | null;
  submoduleKey: string | null;
  permissionKey: string | null;
  entityType: string | null;
  entityId: string | null;
  route: string | null;
  metadata: unknown;
  branch: { id: string; name: string; code: string | null } | null;
  actor: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

export type ErpNotificationsResponse = {
  data: ErpNotificationSummary[];
  total: number;
  unread: number;
  page: number;
  limit: number;
};

export type DashboardSummary = {
  context: {
    scope: DashboardScope;
    title: string;
    range: DashboardRange;
    moduleKeys: string[];
    permissionCount: number;
  };
  preferences: {
    selectedWidgetKeys: string[];
    selectedShortcutKeys: string[];
    layoutItems: DashboardLayoutItem[];
  };
  availableWidgets: DashboardWidgetDefinition[];
  availableShortcuts: DashboardShortcut[];
  widgets: DashboardWidget[];
  shortcuts: DashboardShortcut[];
  notifications: DashboardNotification[];
};
