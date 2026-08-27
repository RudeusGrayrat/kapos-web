import type { BillingDocumentSummary, OpenAccountSummary } from "../types/erp";

type ReceiptItem = {
  productName: string;
  quantity: number;
  total: number;
  status?: string;
};

type ReceiptPayment = {
  amount: number;
  paymentMethod?: { name?: string | null } | null;
};

type ReceiptInput = {
  title: string;
  subtitle: string;
  customerLabel: string;
  items: ReceiptItem[];
  payments?: ReceiptPayment[];
  total: number;
  paidTotal?: number;
  balance?: number;
  footer: string;
};

export function escapeReceiptHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character] ?? character);
}

function writeReceipt(input: ReceiptInput, targetWindow?: Window | null) {
  const printWindow = targetWindow ?? window.open("", "_blank", "width=440,height=720");
  if (!printWindow) throw new Error("El navegador bloqueó la ventana de impresión.");

  const rows = input.items
    .filter((item) => item.status !== "CANCELLED")
    .map((item) => `<tr><td>${item.quantity} x ${escapeReceiptHtml(item.productName)}</td><td>S/ ${item.total.toFixed(2)}</td></tr>`)
    .join("");
  const payments = (input.payments ?? [])
    .map((payment) => `<tr><td>${escapeReceiptHtml(payment.paymentMethod?.name ?? "Pago")}</td><td>S/ ${payment.amount.toFixed(2)}</td></tr>`)
    .join("");
  const paidBlock = input.paidTotal === undefined ? "" : `<div class="total"><span>Pagado</span><span>S/ ${input.paidTotal.toFixed(2)}</span></div>`;
  const balanceBlock = input.balance === undefined ? "" : `<div class="total"><span>Pendiente</span><span>S/ ${input.balance.toFixed(2)}</span></div>`;
  const paymentBlock = payments ? `<h3>Pagos</h3><table>${payments}</table>` : "";

  printWindow.document.write(`<!doctype html><html><head><title>${escapeReceiptHtml(input.title)}</title><style>body{font-family:Arial,sans-serif;max-width:360px;margin:24px auto;color:#151713}h1{text-align:center;letter-spacing:.08em}.center{text-align:center;color:#666;line-height:1.5}table{width:100%;border-collapse:collapse;margin:18px 0}td{padding:8px 0;border-bottom:1px dashed #bbb}td:last-child{text-align:right}.total{font-size:20px;font-weight:700;display:flex;justify-content:space-between;margin-top:8px}.note{margin-top:22px;border:1px solid #222;padding:10px;font-size:11px;font-weight:700;text-align:center}</style></head><body><h1>KAPOS</h1><p class="center">${escapeReceiptHtml(input.subtitle)}<br>${escapeReceiptHtml(input.customerLabel)}<br>${new Date().toLocaleString("es-PE")}</p><table>${rows}</table><div class="total"><span>Total</span><span>S/ ${input.total.toFixed(2)}</span></div>${paidBlock}${balanceBlock}${paymentBlock}<div class="note">${escapeReceiptHtml(input.footer)}</div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script></body></html>`);
  printWindow.document.close();
}

export function printOpenAccountPrebill(
  account: OpenAccountSummary,
  customerLabel: string,
  targetWindow?: Window | null,
) {
  writeReceipt({
    title: `Precuenta ${account.accountNumber}`,
    subtitle: `PRECUENTA - ${account.accountNumber}`,
    customerLabel,
    items: account.items ?? [],
    total: account.total,
    paidTotal: account.paidTotal,
    balance: account.balance,
    footer: "DOCUMENTO OPERATIVO - NO ES COMPROBANTE DE PAGO",
  }, targetWindow);
}

export function printOpenAccountInternalTicket(
  account: OpenAccountSummary,
  customerLabel: string,
  targetWindow?: Window | null,
) {
  writeReceipt({
    title: `Ticket ${account.sale?.saleNumber ?? account.accountNumber}`,
    subtitle: `TICKET INTERNO - ${account.sale?.saleNumber ?? account.accountNumber}`,
    customerLabel,
    items: account.items ?? [],
    payments: account.payments,
    total: account.total,
    footer: "NO ES COMPROBANTE ELECTRONICO SUNAT",
  }, targetWindow);
}

export function printBillingDocumentTicket(document: BillingDocumentSummary) {
  writeReceipt({
    title: `Ticket ${document.series && document.number ? `${document.series}-${document.number}` : document.sale.saleNumber}`,
    subtitle: `TICKET INTERNO - ${document.series && document.number ? `${document.series}-${document.number}` : document.sale.saleNumber}`,
    customerLabel: document.sale.customerProfile
      ? [document.sale.customerProfile.user.firstName, document.sale.customerProfile.user.lastName].filter(Boolean).join(" ") || "Cliente"
      : "Clientes varios",
    items: document.sale.items ?? [],
    total: document.sale.total,
    footer: "NO ES COMPROBANTE ELECTRONICO SUNAT",
  });
}
