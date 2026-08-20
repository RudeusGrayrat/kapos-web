"use client";

import { useEffect, useState } from "react";
import {
  ChefHat,
  Clock3,
  CreditCard,
  Link2,
  MapPin,
  PackagePlus,
  Printer,
  ReceiptText,
  ShoppingBag,
  Split,
  Trash2,
  Undo2,
  Utensils,
} from "lucide-react";
import { AdminActionButton, PlusIcon } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import {
  addOpenAccountItems,
  cancelOpenAccountItem,
  createOpenAccount,
  generateOpenAccountPrebill,
  getBranches,
  getCustomers,
  getDiningAreas,
  getOpenAccount,
  getOpenAccounts,
  getOpenCashSession,
  getPaymentMethods,
  getProducts,
  joinOpenAccountTable,
  moveOpenAccountTable,
  recordOpenAccountPayment,
  releaseOpenAccountTable,
  sendOpenAccountToKitchen,
  updateOpenAccount,
} from "../../../lib/erp-api";
import type {
  BranchSummary,
  CustomerSummary,
  DiningAreaSummary,
  OpenAccountSummary,
  PaymentMethodSummary,
  ProductSummary,
  ServiceType,
} from "../../../types/erp";

const inputClass =
  "w-full rounded-[18px] border border-[#dfe7cf] bg-white px-4 py-3 text-sm text-[#1f2813] outline-none transition focus:border-[#a9cf24]";

const serviceLabels: Record<ServiceType, string> = {
  LOCAL: "En local",
  DELIVERY: "Delivery",
  TAKEAWAY: "Para llevar",
};

function accountLabel(account: OpenAccountSummary) {
  return account.diningTable?.name ?? account.customerName ?? serviceLabels[account.serviceType];
}

function customerOptionLabel(customer: CustomerSummary) {
  return [customer.user.firstName, customer.user.lastName].filter(Boolean).join(" ") || customer.user.documentNumber || customer.user.phone || customer.user.email || "Cliente";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character] ?? character);
}

function printPrebill(account: OpenAccountSummary, targetWindow?: Window | null) {
  const printWindow = targetWindow ?? window.open("", "_blank", "width=440,height=720");
  if (!printWindow) throw new Error("El navegador bloqueó la ventana de impresión.");
  const rows = (account.items ?? [])
    .filter((item) => item.status === "ACTIVE")
    .map((item) => `<tr><td>${item.quantity} × ${escapeHtml(item.productName)}</td><td>S/ ${item.total.toFixed(2)}</td></tr>`)
    .join("");
  printWindow.document.write(`<!doctype html><html><head><title>Precuenta ${escapeHtml(account.accountNumber)}</title><style>body{font-family:Arial,sans-serif;max-width:360px;margin:24px auto;color:#151713}h1{text-align:center;letter-spacing:.08em}p{text-align:center;color:#666}table{width:100%;border-collapse:collapse;margin:24px 0}td{padding:9px 0;border-bottom:1px dashed #bbb}td:last-child{text-align:right}.total{font-size:22px;font-weight:700;display:flex;justify-content:space-between}.note{margin-top:28px;border:1px solid #222;padding:10px;font-size:11px;font-weight:700}</style></head><body><h1>KAPOS</h1><p>PRECUENTA · ${escapeHtml(account.accountNumber)}<br>${escapeHtml(accountLabel(account))}<br>${new Date().toLocaleString("es-PE")}</p><table>${rows}</table><div class="total"><span>Total</span><span>S/ ${account.total.toFixed(2)}</span></div><div class="total"><span>Pagado</span><span>S/ ${account.paidTotal.toFixed(2)}</span></div><div class="total"><span>Pendiente</span><span>S/ ${account.balance.toFixed(2)}</span></div><div class="note">DOCUMENTO OPERATIVO · NO ES COMPROBANTE DE PAGO</div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script></body></html>`);
  printWindow.document.close();
}

export default function PosPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [branchId, setBranchId] = useState("");
  const [areas, setAreas] = useState<DiningAreaSummary[]>([]);
  const [accounts, setAccounts] = useState<OpenAccountSummary[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<OpenAccountSummary | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [cashSessionId, setCashSessionId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("LOCAL");
  const [newAccount, setNewAccount] = useState({
    diningTableId: "",
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    deliveryReference: "",
    customerProfileId: "",
    guestCount: "2",
    note: "",
  });
  const [itemForm, setItemForm] = useState({ productId: "", quantity: "1", note: "" });
  const [paymentForm, setPaymentForm] = useState({ paymentMethodId: "", amount: "" });
  const [paymentCustomerProfileId, setPaymentCustomerProfileId] = useState("");
  const [tableAction, setTableAction] = useState<"MOVE" | "JOIN" | null>(null);
  const [targetTableId, setTargetTableId] = useState("");
  const [splitByItems, setSplitByItems] = useState(false);
  const [itemAllocations, setItemAllocations] = useState<Record<string, number>>({});
  const [cancelItemId, setCancelItemId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadBranchContext(nextBranchId = branchId) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !nextBranchId) return;
    const [nextAreas, nextAccounts, productResponse, methods, openSession, customerResponse] = await Promise.all([
      getDiningAreas({ accessToken: token, organizationId: activeOrganizationId, branchId: nextBranchId }),
      getOpenAccounts({ accessToken: token, organizationId: activeOrganizationId, branchId: nextBranchId }),
      getProducts({ accessToken: token, organizationId: activeOrganizationId, page: 1, limit: 100 }),
      getPaymentMethods({ accessToken: token, organizationId: activeOrganizationId }),
      getOpenCashSession({ accessToken: token, organizationId: activeOrganizationId, branchId: nextBranchId }),
      getCustomers({ accessToken: token, organizationId: activeOrganizationId, page: 1, limit: 100 }),
    ]);
    setAreas(nextAreas);
    setAccounts(nextAccounts);
    setProducts(productResponse.data.filter((product) => product.status === "ACTIVE" && product.availableForPos));
    setPaymentMethods(methods.filter((method) => method.enabled));
    setCashSessionId(openSession?.branchId === nextBranchId ? openSession.id : null);
    setCustomers(customerResponse.data);
    setItemForm((current) => ({ ...current, productId: current.productId || productResponse.data[0]?.id || "" }));
    setPaymentForm((current) => ({ ...current, paymentMethodId: current.paymentMethodId || methods.find((method) => method.enabled)?.id || "" }));
  }

  async function refreshAccounts(nextBranchId = branchId) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !nextBranchId) return;
    const rows = await getOpenAccounts({ accessToken: token, organizationId: activeOrganizationId, branchId: nextBranchId });
    setAccounts(rows);
    if (selectedAccount && rows.some((account) => account.id === selectedAccount.id)) {
      const detail = await getOpenAccount({ accessToken: token, organizationId: activeOrganizationId, accountId: selectedAccount.id });
      setSelectedAccount(detail);
      if (!splitByItems) setPaymentForm((current) => ({ ...current, amount: detail.balance.toFixed(2) }));
    } else if (selectedAccount) {
      setSelectedAccount(null);
    }
  }

  async function refreshDiningAreas(nextBranchId = branchId) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !nextBranchId) return;
    setAreas(await getDiningAreas({
      accessToken: token,
      organizationId: activeOrganizationId,
      branchId: nextBranchId,
    }));
  }

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const token = await resolveToken();
      if (!token || !activeOrganizationId) return;
      try {
        const rows = await getBranches({ accessToken: token, organizationId: activeOrganizationId });
        if (!mounted) return;
        const active = rows.filter((branch) => branch.status === "ACTIVE");
        const nextBranchId = active[0]?.id ?? "";
        setBranches(active);
        setBranchId(nextBranchId);
        if (nextBranchId) await loadBranchContext(nextBranchId);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "No se pudo iniciar el POS.");
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  useEffect(() => {
    if (!branchId) return;
    const timer = window.setInterval(() => void refreshAccounts(), 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, selectedAccount?.id, splitByItems]);

  async function openAccount(accountId: string) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    try {
      const detail = await getOpenAccount({ accessToken: token, organizationId: activeOrganizationId, accountId });
      setSelectedAccount(detail);
      setPaymentCustomerProfileId(detail.customerProfileId ?? "");
      setPaymentForm((current) => ({ ...current, amount: detail.balance.toFixed(2) }));
      setSplitByItems(false);
      setItemAllocations({});
      setTableAction(null);
      setCancelItemId(null);
      setShowCreate(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo abrir la cuenta.");
    }
  }

  async function handleCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !branchId) return;
    setBusy(true);
    setError(null);
    try {
      const account = await createOpenAccount({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          branchId,
          serviceType,
          customerProfileId: newAccount.customerProfileId || undefined,
          diningTableId: serviceType === "LOCAL" ? newAccount.diningTableId : undefined,
          guestCount: serviceType === "LOCAL" ? Number(newAccount.guestCount) : undefined,
          customerName: serviceType === "DELIVERY" ? newAccount.customerName : undefined,
          customerPhone: serviceType === "DELIVERY" ? newAccount.customerPhone : undefined,
          deliveryAddress: serviceType === "DELIVERY" ? newAccount.deliveryAddress : undefined,
          deliveryReference: serviceType === "DELIVERY" ? newAccount.deliveryReference : undefined,
          note: newAccount.note || undefined,
        },
      });
      setSelectedAccount(account);
      setPaymentCustomerProfileId(account.customerProfileId ?? "");
      setShowCreate(false);
      setNewAccount({ diningTableId: "", customerName: "", customerPhone: "", deliveryAddress: "", deliveryReference: "", customerProfileId: "", guestCount: "2", note: "" });
      await Promise.all([refreshAccounts(), refreshDiningAreas()]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo iniciar el pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedAccount || !itemForm.productId) return;
    setBusy(true);
    setError(null);
    try {
      const account = await addOpenAccountItems({
        accessToken: token,
        organizationId: activeOrganizationId,
        accountId: selectedAccount.id,
        body: {
          expectedVersion: selectedAccount.version,
          items: [{ productId: itemForm.productId, quantity: Number(itemForm.quantity), note: itemForm.note || undefined }],
        },
      });
      setSelectedAccount(account);
      setItemForm((current) => ({ ...current, quantity: "1", note: "" }));
      setPaymentForm((current) => ({ ...current, amount: account.balance.toFixed(2) }));
      await refreshAccounts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo agregar el producto.");
    } finally {
      setBusy(false);
    }
  }

  async function handleKitchen() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedAccount) return;
    setBusy(true);
    try {
      const account = await sendOpenAccountToKitchen({
        accessToken: token,
        organizationId: activeOrganizationId,
        accountId: selectedAccount.id,
        body: { expectedVersion: selectedAccount.version },
      });
      setSelectedAccount(account);
      await refreshAccounts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo enviar la comanda.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTableAction() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedAccount || !tableAction || !targetTableId) return;
    setBusy(true);
    setError(null);
    try {
      const input = {
        accessToken: token,
        organizationId: activeOrganizationId,
        accountId: selectedAccount.id,
        body: { expectedVersion: selectedAccount.version, diningTableId: targetTableId },
      };
      const account = tableAction === "MOVE"
        ? await moveOpenAccountTable(input)
        : await joinOpenAccountTable(input);
      setSelectedAccount(account);
      setTableAction(null);
      setTargetTableId("");
      await Promise.all([refreshAccounts(), refreshDiningAreas()]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo actualizar la mesa.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReleaseTable(tableId: string) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedAccount) return;
    setBusy(true);
    setError(null);
    try {
      const account = await releaseOpenAccountTable({
        accessToken: token,
        organizationId: activeOrganizationId,
        accountId: selectedAccount.id,
        tableId,
        expectedVersion: selectedAccount.version,
      });
      setSelectedAccount(account);
      await Promise.all([refreshAccounts(), refreshDiningAreas()]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo liberar la mesa.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePrebill() {
    const prebillWindow = window.open("", "_blank", "width=440,height=720");
    if (!prebillWindow) {
      setError("El navegador bloqueó la ventana de impresión.");
      return;
    }
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedAccount) {
      prebillWindow.close();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const account = await generateOpenAccountPrebill({
        accessToken: token,
        organizationId: activeOrganizationId,
        accountId: selectedAccount.id,
        expectedVersion: selectedAccount.version,
      });
      setSelectedAccount(account);
      printPrebill(account, prebillWindow);
      await refreshAccounts();
    } catch (submitError) {
      prebillWindow.close();
      setError(submitError instanceof Error ? submitError.message : "No se pudo generar la precuenta.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelItem(itemId: string) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedAccount || !cancelReason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const account = await cancelOpenAccountItem({
        accessToken: token,
        organizationId: activeOrganizationId,
        accountId: selectedAccount.id,
        itemId,
        body: { expectedVersion: selectedAccount.version, reason: cancelReason.trim() },
      });
      setSelectedAccount(account);
      setCancelItemId(null);
      setCancelReason("");
      setPaymentForm((current) => ({ ...current, amount: account.balance.toFixed(2) }));
      await refreshAccounts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo anular el producto.");
    } finally {
      setBusy(false);
    }
  }

  function updateItemAllocation(itemId: string, quantity: number) {
    if (!selectedAccount) return;
    const next = { ...itemAllocations };
    if (quantity > 0) next[itemId] = quantity;
    else delete next[itemId];
    const amount = (selectedAccount.items ?? []).reduce((total, item) => {
      const selectedQuantity = next[item.id] ?? 0;
      return total + (item.total / item.quantity) * selectedQuantity;
    }, 0);
    setItemAllocations(next);
    setPaymentForm((current) => ({ ...current, amount: amount.toFixed(2) }));
  }

  async function handlePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedAccount || !cashSessionId) return;
    setBusy(true);
    setError(null);
    try {
      let paymentAccount = selectedAccount;
      if ((selectedAccount.customerProfileId ?? "") !== paymentCustomerProfileId) {
        paymentAccount = await updateOpenAccount({
          accessToken: token,
          organizationId: activeOrganizationId,
          accountId: selectedAccount.id,
          body: {
            expectedVersion: selectedAccount.version,
            customerProfileId: paymentCustomerProfileId || null,
          },
        });
      }
      const account = await recordOpenAccountPayment({
        accessToken: token,
        organizationId: activeOrganizationId,
        accountId: paymentAccount.id,
        body: {
          expectedVersion: paymentAccount.version,
          idempotencyKey: crypto.randomUUID(),
          cashSessionId,
          paymentMethodId: paymentForm.paymentMethodId || undefined,
          amount: Number(paymentForm.amount),
          allocations: splitByItems
            ? Object.entries(itemAllocations).map(([itemId, quantity]) => ({ itemId, quantity }))
            : undefined,
        },
      });
      setSelectedAccount(account.status === "CLOSED" ? null : account);
      setSplitByItems(false);
      setItemAllocations({});
      await Promise.all([refreshAccounts(), refreshDiningAreas()]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo registrar el pago.");
    } finally {
      setBusy(false);
    }
  }

  const availableTables = areas.flatMap((area) => area.tables.filter((table) => table.isActive && !table.activeAccount).map((table) => ({ ...table, areaName: area.name })));
  const pendingKitchenItems = selectedAccount?.items?.filter((item) => item.status === "ACTIVE" && !item.kitchenTicketId).length ?? 0;
  const activeItems = selectedAccount?.items?.filter((item) => item.status === "ACTIVE") ?? [];
  const canMoveTables = effectivePermissionKeys.includes("sales.orders.move_table");
  const canGeneratePrebill = effectivePermissionKeys.includes("sales.orders.prebill");
  const canCancelItems = effectivePermissionKeys.includes("sales.orders.cancel_item");

  return (
    <section className="space-y-7">
      <AdminModuleHeader
        eyebrow="Punto de venta"
        title="Operación en vivo"
        description="Abre pedidos, acumula consumos, envía comandas y cobra la misma cuenta que verá el equipo Izipay."
        action={<div className="flex flex-wrap gap-3"><select className={`${inputClass} min-w-56`} value={branchId} onChange={(event) => { setBranchId(event.target.value); setSelectedAccount(null); void loadBranchContext(event.target.value); }}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><AdminActionButton tone="primary" icon={<PlusIcon />} onClick={() => { setShowCreate(true); setSelectedAccount(null); }}>Iniciar pedido</AdminActionButton></div>}
      />

      {error ? <AdminMessage title="La operación necesita atención" description={error} tone="warn" /> : null}
      {!cashSessionId ? <AdminMessage title="Caja cerrada" description="Puedes preparar pedidos, pero debes abrir una caja en esta sucursal antes de cobrar." tone="warn" /> : null}

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <PanelCard title="Cuentas abiertas" description={`${accounts.length} operaciones sincronizadas`}>
          <div className="space-y-3">
            {accounts.length === 0 ? <p className="py-8 text-center text-sm text-[#6b745d]">No hay cuentas abiertas.</p> : null}
            {accounts.map((account) => (
              <button key={account.id} type="button" onClick={() => void openAccount(account.id)} className={`w-full rounded-[22px] border p-4 text-left transition ${selectedAccount?.id === account.id ? "border-[#aaca39] bg-[#f6fbdc]" : "border-[#e4ead6] bg-white hover:border-[#bfd481]"}`}>
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-[#1b2111]">{accountLabel(account)}</p><Tag tone={account.status === "PARTIALLY_PAID" ? "warn" : "accent"}>{account.status === "PARTIALLY_PAID" ? "Parcial" : "Abierta"}</Tag></div>
                <p className="mt-1 text-xs text-[#768063]">{account.accountNumber} · {serviceLabels[account.serviceType]}</p>
                <div className="mt-4 flex items-end justify-between"><span className="text-xs text-[#6d765e]">Saldo</span><strong className="text-xl text-[#27350f]">S/ {account.balance.toFixed(2)}</strong></div>
              </button>
            ))}
          </div>
        </PanelCard>

        {showCreate ? (
          <PanelCard title="Iniciar pedido" description="Los datos de delivery aparecen únicamente cuando corresponde.">
            <form className="space-y-5" onSubmit={handleCreateAccount}>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["LOCAL", "DELIVERY", "TAKEAWAY"] as ServiceType[]).map((type) => (
                  <button key={type} type="button" onClick={() => setServiceType(type)} className={`rounded-[24px] border p-5 text-left transition ${serviceType === type ? "border-[#a6ca32] bg-[#f3fad6]" : "border-[#e4ead6] bg-white"}`}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#4f651c]">{type === "LOCAL" ? <Utensils className="h-5 w-5" /> : type === "DELIVERY" ? <MapPin className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}</span><strong className="mt-4 block text-[#1d2611]">{serviceLabels[type]}</strong></button>
                ))}
              </div>
              {serviceType === "LOCAL" ? <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Mesa</span><select className={inputClass} value={newAccount.diningTableId} onChange={(event) => setNewAccount((current) => ({ ...current, diningTableId: event.target.value }))} required><option value="">Selecciona una mesa libre</option>{availableTables.map((table) => <option key={table.id} value={table.id}>{table.areaName} · {table.name}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-semibold">Comensales</span><input className={inputClass} type="number" min="1" value={newAccount.guestCount} onChange={(event) => setNewAccount((current) => ({ ...current, guestCount: event.target.value }))} /></label></div> : null}
              {serviceType === "DELIVERY" ? <div className="grid gap-4 md:grid-cols-2"><input className={inputClass} placeholder="Nombre del cliente" value={newAccount.customerName} onChange={(event) => setNewAccount((current) => ({ ...current, customerName: event.target.value }))} required /><input className={inputClass} placeholder="Teléfono" value={newAccount.customerPhone} onChange={(event) => setNewAccount((current) => ({ ...current, customerPhone: event.target.value }))} /><input className={`${inputClass} md:col-span-2`} placeholder="Dirección de entrega" value={newAccount.deliveryAddress} onChange={(event) => setNewAccount((current) => ({ ...current, deliveryAddress: event.target.value }))} required /><input className={`${inputClass} md:col-span-2`} placeholder="Referencia (opcional)" value={newAccount.deliveryReference} onChange={(event) => setNewAccount((current) => ({ ...current, deliveryReference: event.target.value }))} /></div> : null}
              <label className="space-y-2"><span className="text-sm font-semibold">Cliente para puntos (opcional)</span><select className={inputClass} value={newAccount.customerProfileId} onChange={(event) => setNewAccount((current) => ({ ...current, customerProfileId: event.target.value }))}><option value="">Venta sin cliente identificado</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customerOptionLabel(customer)}</option>)}</select></label>
              <textarea className={inputClass} placeholder="Observación general (opcional)" value={newAccount.note} onChange={(event) => setNewAccount((current) => ({ ...current, note: event.target.value }))} />
              <div className="flex justify-end gap-3"><AdminActionButton tone="ghost" onClick={() => setShowCreate(false)}>Cancelar</AdminActionButton><AdminActionButton type="submit" tone="primary" disabled={busy}>Abrir cuenta</AdminActionButton></div>
            </form>
          </PanelCard>
        ) : selectedAccount ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] bg-[#151713] p-5 text-white"><p className="text-sm text-white/60">Cuenta</p><strong className="mt-3 block text-2xl">{accountLabel(selectedAccount)}</strong><p className="mt-2 text-xs text-white/55">{selectedAccount.accountNumber}</p></div>
              <div className="rounded-[28px] border border-[#dce8b4] bg-[#f7fbdc] p-5"><p className="text-sm text-[#67734e]">Total acumulado</p><strong className="mt-3 block text-3xl text-[#26350d]">S/ {selectedAccount.total.toFixed(2)}</strong></div>
              <div className="rounded-[28px] border border-[#eadfcb] bg-[#fff9ec] p-5"><p className="text-sm text-[#756b56]">Saldo pendiente</p><strong className="mt-3 block text-3xl text-[#654d20]">S/ {selectedAccount.balance.toFixed(2)}</strong></div>
            </div>

            <PanelCard title="Herramientas de cuenta" description="Traslada la atención, anexa mesas o entrega una precuenta sin cerrar la venta.">
              <div className="flex flex-wrap gap-3">
                {selectedAccount.serviceType === "LOCAL" && canMoveTables ? <AdminActionButton icon={<Undo2 className="h-4 w-4" />} onClick={() => setTableAction("MOVE")}>Cambiar mesa</AdminActionButton> : null}
                {selectedAccount.serviceType === "LOCAL" && canMoveTables ? <AdminActionButton icon={<Link2 className="h-4 w-4" />} onClick={() => setTableAction("JOIN")}>Unir mesa libre</AdminActionButton> : null}
                {canGeneratePrebill ? <AdminActionButton tone="accent" icon={<Printer className="h-4 w-4" />} disabled={busy || activeItems.length === 0} onClick={() => void handlePrebill()}>Precuenta</AdminActionButton> : null}
              </div>
              {selectedAccount.tableLinks?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag tone="accent">Principal: {selectedAccount.diningTable?.name}</Tag>
                  {selectedAccount.tableLinks.map((link) => (
                    <button key={link.id} type="button" className="rounded-full border border-[#dbe6bf] bg-white px-3 py-1 text-xs font-semibold text-[#4d5b30]" onClick={() => void handleReleaseTable(link.diningTableId)}>
                      {link.diningTable.name} · liberar
                    </button>
                  ))}
                </div>
              ) : null}
              {tableAction ? (
                <div className="mt-4 grid gap-3 rounded-[22px] border border-[#e0e8ce] bg-[#fafcf4] p-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <select className={inputClass} value={targetTableId} onChange={(event) => setTargetTableId(event.target.value)}>
                    <option value="">Selecciona una mesa libre</option>
                    {availableTables.map((table) => <option key={table.id} value={table.id}>{table.areaName} · {table.name}</option>)}
                  </select>
                  <AdminActionButton tone="primary" disabled={busy || !targetTableId} onClick={() => void handleTableAction()}>{tableAction === "MOVE" ? "Trasladar cuenta" : "Anexar mesa"}</AdminActionButton>
                  <AdminActionButton tone="ghost" onClick={() => { setTableAction(null); setTargetTableId(""); }}>Cancelar</AdminActionButton>
                </div>
              ) : null}
            </PanelCard>

            <PanelCard title="Agregar productos" description="Cada observación viaja con el ítem hacia cocina.">
              <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_auto]" onSubmit={handleAddItem}><select className={inputClass} value={itemForm.productId} onChange={(event) => setItemForm((current) => ({ ...current, productId: event.target.value }))} required>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · S/ {product.price.toFixed(2)}</option>)}</select><input className={inputClass} type="number" min="0.001" step="0.001" value={itemForm.quantity} onChange={(event) => setItemForm((current) => ({ ...current, quantity: event.target.value }))} /><input className={inputClass} placeholder="Ej. sin cebolla" value={itemForm.note} onChange={(event) => setItemForm((current) => ({ ...current, note: event.target.value }))} /><AdminActionButton type="submit" tone="accent" icon={<PackagePlus className="h-4 w-4" />} disabled={busy}>Agregar</AdminActionButton></form>
              <div className="mt-5 divide-y divide-[#edf0e6]">
                {selectedAccount.items?.map((item) => (
                  <div key={item.id} className={`py-3 ${item.status === "CANCELLED" ? "opacity-55" : ""}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className={`font-semibold text-[#1d2512] ${item.status === "CANCELLED" ? "line-through" : ""}`}>{item.quantity} × {item.productName}</p>
                        <p className="text-xs text-[#717b60]">{item.status === "CANCELLED" ? `Anulado: ${item.cancellationReason}` : item.note || (item.kitchenTicketId ? `Comanda #${item.kitchenTicket?.sequence ?? ""}` : "Pendiente de enviar")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <strong>S/ {item.total.toFixed(2)}</strong>
                        {item.status === "ACTIVE" && canCancelItems ? <AdminActionButton size="icon" tone="danger" aria-label={`Anular ${item.productName}`} icon={<Trash2 className="h-4 w-4" />} onClick={() => { setCancelItemId(item.id); setCancelReason(""); }} /> : null}
                      </div>
                    </div>
                    {cancelItemId === item.id ? (
                      <div className="mt-3 grid gap-3 rounded-2xl bg-[#fff4f1] p-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <input className={inputClass} placeholder="Motivo obligatorio de anulación" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
                        <AdminActionButton tone="danger" disabled={busy || !cancelReason.trim()} onClick={() => void handleCancelItem(item.id)}>Confirmar anulación</AdminActionButton>
                        <AdminActionButton tone="ghost" onClick={() => { setCancelItemId(null); setCancelReason(""); }}>Volver</AdminActionButton>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end"><AdminActionButton tone="primary" icon={<ChefHat className="h-4 w-4" />} onClick={() => void handleKitchen()} disabled={busy || pendingKitchenItems === 0}>Enviar {pendingKitchenItems} a cocina</AdminActionButton></div>
            </PanelCard>

            <PanelCard title="Cobrar cuenta" description="Cobra un monto libre o selecciona exactamente qué productos paga cada persona.">
              <label className="mb-4 block space-y-2">
                <span className="text-sm font-semibold">Cliente fiscal / puntos</span>
                <select className={inputClass} value={paymentCustomerProfileId} onChange={(event) => setPaymentCustomerProfileId(event.target.value)}>
                  <option value="">Cliente final / Clientes varios</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customerOptionLabel(customer)}</option>)}
                </select>
                <small className="block leading-5 text-[#6b7558]">Para boleta con DNI o factura con RUC, selecciona el cliente antes de registrar el último pago.</small>
              </label>
              <div className="mb-4 flex flex-wrap gap-2">
                <AdminActionButton active={!splitByItems} onClick={() => { setSplitByItems(false); setItemAllocations({}); setPaymentForm((current) => ({ ...current, amount: selectedAccount.balance.toFixed(2) })); }}>Monto libre</AdminActionButton>
                <AdminActionButton active={splitByItems} icon={<Split className="h-4 w-4" />} onClick={() => { setSplitByItems(true); setItemAllocations({}); setPaymentForm((current) => ({ ...current, amount: "0.00" })); }}>Dividir por productos</AdminActionButton>
              </div>
              {splitByItems ? (
                <div className="mb-4 divide-y divide-[#e7ecd9] rounded-[22px] border border-[#e0e8ce] bg-[#fbfcf7] px-4">
                  {activeItems.filter((item) => item.remainingQuantity > 0).map((item) => (
                    <div key={item.id} className="grid items-center gap-3 py-3 md:grid-cols-[minmax(0,1fr)_120px_130px]">
                      <div><p className="font-semibold text-[#202814]">{item.productName}</p><p className="text-xs text-[#737c62]">Pendiente {item.remainingQuantity} de {item.quantity}</p></div>
                      <input className={inputClass} type="number" min="0" max={item.remainingQuantity} step="0.001" value={itemAllocations[item.id] ?? 0} onChange={(event) => updateItemAllocation(item.id, Math.min(item.remainingQuantity, Math.max(0, Number(event.target.value))))} />
                      <strong className="text-right text-[#334414]">S/ {(((itemAllocations[item.id] ?? 0) * item.total) / item.quantity).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
              <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]" onSubmit={handlePayment}><select className={inputClass} value={paymentForm.paymentMethodId} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentMethodId: event.target.value }))}>{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select><input className={inputClass} type="number" min="0.01" max={selectedAccount.balance} step="0.01" value={paymentForm.amount} readOnly={splitByItems} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} required /><AdminActionButton type="submit" tone="primary" icon={<CreditCard className="h-4 w-4" />} disabled={busy || !cashSessionId || Number(paymentForm.amount) <= 0}>Registrar pago</AdminActionButton></form>
            </PanelCard>
          </div>
        ) : (
          <div className="grid min-h-[540px] place-items-center rounded-[36px] border border-dashed border-[#dce5c7] bg-[radial-gradient(circle_at_top,#f4fad9_0%,#fbfcf8_48%,#ffffff_100%)] p-8 text-center"><div className="max-w-md"><span className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-[#171917] text-[#c9ef4b]"><ReceiptText className="h-9 w-9" /></span><h2 className="mt-6 text-3xl font-semibold text-[#1a210f]">Selecciona una cuenta</h2><p className="mt-3 leading-7 text-[#626c52]">Retoma un pedido abierto o inicia uno nuevo. El catálogo solo aparece dentro de una operación, no como un carrito global.</p><div className="mt-6 flex justify-center gap-4 text-xs text-[#788168]"><span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />Sincronización cada 5 s</span><span className="flex items-center gap-1"><CreditCard className="h-4 w-4" />Pagos parciales</span></div></div></div>
        )}
      </div>
    </section>
  );
}
