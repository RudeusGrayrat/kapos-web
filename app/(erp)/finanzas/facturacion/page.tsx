"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, FileCheck2, FileMinus2, Printer, Settings } from "lucide-react";
import { AdminActionButton, SparkIcon } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { AdminDataTable } from "../../../components/admin/AdminDataTable";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import { useToast } from "../../../context/toast-context";
import { getBillingDocuments, issueBillingDocument, issueCreditNote } from "../../../lib/erp-api";
import { printBillingDocumentTicket } from "../../../lib/receipt-printing";
import type { BillingDocumentStatus, BillingDocumentSummary } from "../../../types/erp";

const inputClass =
  "w-full rounded-[18px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#00C70D]";

function statusLabel(status: BillingDocumentStatus) {
  return {
    PENDING: "Pendiente",
    ISSUING: "Validando SUNAT",
    BILLED: "Emitido",
    FAILED: "Con error",
    CANCELLED: "Anulado",
  }[status];
}

function statusTone(status: BillingDocumentStatus): "soft" | "accent" | "dark" | "warn" {
  if (status === "BILLED") return "accent";
  if (status === "ISSUING") return "dark";
  if (status === "FAILED" || status === "CANCELLED") return "warn";
  return "soft";
}

export default function FacturacionPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<"" | BillingDocumentStatus>("");
  const [documentTotal, setDocumentTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<BillingDocumentSummary | null>(null);
  const [creditNoteDocument, setCreditNoteDocument] = useState<BillingDocumentSummary | null>(null);
  const [detailDocument, setDetailDocument] = useState<BillingDocumentSummary | null>(null);
  const [issueType, setIssueType] = useState<"BOLETA" | "FACTURA">("BOLETA");
  const [creditNoteReasonCode, setCreditNoteReasonCode] = useState<"01" | "04" | "06" | "07">("01");
  const [creditNoteReason, setCreditNoteReason] = useState("");
  const [reverseSale, setReverseSale] = useState(true);
  const [busy, setBusy] = useState(false);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function fetchDocuments(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organización activa.");
    const response = await getBillingDocuments({
      accessToken: token,
      organizationId: activeOrganizationId,
      page: input.page,
      limit: input.limit,
      search: input.search,
      status: statusFilter || undefined,
    });
    return { data: response.data, total: response.total };
  }

  function openIssue(document: BillingDocumentSummary) {
    setSelectedDocument(document);
    setIssueType(document.type === "FACTURA" ? "FACTURA" : "BOLETA");
  }

  async function confirmIssue() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedDocument) return;
    setBusy(true);
    try {
      const issued = await issueBillingDocument({
        accessToken: token,
        organizationId: activeOrganizationId,
        documentId: selectedDocument.id,
        documentType: issueType,
      });
      setSelectedDocument(null);
      setReloadKey((current) => current + 1);
      toast.showSuccess(`Comprobante ${issued.series}-${issued.number} emitido correctamente.`, "Comprobante emitido");
      if (issued.pdfUrl) window.open(issued.pdfUrl, "_blank", "noopener,noreferrer");
    } catch (issueError) {
      toast.showError(issueError, "No se pudo emitir");
      setReloadKey((current) => current + 1);
    } finally {
      setBusy(false);
    }
  }

  function openCreditNote(document: BillingDocumentSummary) {
    setCreditNoteDocument(document);
    setCreditNoteReasonCode("01");
    setCreditNoteReason("");
    setReverseSale(true);
  }

  async function confirmCreditNote() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !creditNoteDocument || !creditNoteReason.trim()) return;
    setBusy(true);
    try {
      const note = await issueCreditNote({
        accessToken: token,
        organizationId: activeOrganizationId,
        documentId: creditNoteDocument.id,
        reasonCode: creditNoteReasonCode,
        reason: creditNoteReason.trim(),
        reverseSale,
      });
      setCreditNoteDocument(null);
      setReloadKey((current) => current + 1);
      toast.showSuccess(`Nota de crédito ${note.series}-${note.number} emitida correctamente.`, "Nota emitida");
      if (note.pdfUrl) window.open(note.pdfUrl, "_blank", "noopener,noreferrer");
    } catch (noteError) {
      toast.showError(noteError, "No se pudo emitir la nota");
      setReloadKey((current) => current + 1);
    } finally {
      setBusy(false);
    }
  }

  function documentName(document: BillingDocumentSummary | null) {
    if (!document) return "Comprobante";
    if (document.series && document.number) return `${document.series}-${document.number}`;
    return document.type === "TICKET" ? "Por definir" : document.type;
  }

  function customerName(document: BillingDocumentSummary | null) {
    const user = document?.sale.customerProfile?.user;
    if (!user) return "Clientes varios";
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Sin nombre";
  }

  function providerResponseText(document: BillingDocumentSummary | null) {
    if (!document?.rawResponse) return "Sin respuesta registrada del proveedor.";
    return JSON.stringify(document.rawResponse, null, 2);
  }

  function canIssueCreditNote(document: BillingDocumentSummary) {
    if (document.status !== "BILLED") return false;
    if (document.type !== "BOLETA" && document.type !== "FACTURA") return false;
    return !document.adjustmentDocuments?.some((note) => note.type === "NOTA_CREDITO" && note.status !== "CANCELLED");
  }

  function printBillingPdf(document: BillingDocumentSummary) {
    if (!document.pdfUrl) {
      toast.showError("Este comprobante no tiene PDF disponible para imprimir.", "Sin PDF");
      return;
    }
    const printWindow = window.open(document.pdfUrl, "_blank", "width=520,height=760");
    if (!printWindow) {
      toast.showError("Permite ventanas emergentes para Kapos.", "Impresion bloqueada");
      return;
    }
    printWindow.focus();
    window.setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        toast.showError("Se abrio el PDF, pero el navegador no permitio lanzar la impresion automatica.", "Impresion bloqueada");
      }
    }, 1200);
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Finanzas"
        title="Facturación"
        description="Bandeja operativa de comprobantes: emisión, reintentos, errores y documentos generados."
        action={
          <Link href="/finanzas/facturacion/configuracion">
            <AdminActionButton icon={<Settings className="h-4 w-4" />}>Configuración</AdminActionButton>
          </Link>
        }
        stats={[
          { label: "Comprobantes", value: String(documentTotal), hint: "Resultados según el filtro actual.", tone: "dark" },
          { label: "Pendientes", value: "Filtro", hint: "Usa el selector para revisar por estado.", tone: "accent" },
          { label: "Origen", value: "Web y Mobile", hint: "Ambos puntos de venta alimentan esta bandeja." },
        ]}
      />

      <PanelCard
        title="Comprobantes"
        description="Las ventas quedan registradas aunque el proveedor falle. Desde aquí puedes corregir datos y reintentar con el mismo correlativo."
        action={
          <select className={`${inputClass} min-w-44`} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as "" | BillingDocumentStatus); setReloadKey((current) => current + 1); }}>
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="ISSUING">Emitiendo</option>
            <option value="BILLED">Emitidos</option>
            <option value="FAILED">Con error</option>
            <option value="CANCELLED">Anulados</option>
          </select>
        }
      >
        <AdminDataTable
          fetchData={fetchDocuments}
          reloadKey={`${activeOrganizationId ?? ""}-${statusFilter}-${reloadKey}`}
          onDataLoaded={(result) => setDocumentTotal(result.total)}
          rowKey={(row) => row.id}
          permissionKeys={effectivePermissionKeys}
          searchPlaceholder="Venta, serie, correlativo o documento..."
          emptyTitle="No hay comprobantes"
          emptyDescription="Cuando cobres desde Web o Mobile, las ventas aparecerán en esta bandeja."
          columns={[
            { key: "sale", label: "Venta", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.sale.saleNumber}</p><p className="text-xs text-[#A1A1A1]">{row.sale.branch.name} · {new Date(row.sale.soldAt).toLocaleString("es-PE")}</p></div> },
            { key: "document", label: "Comprobante", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.series && row.number ? `${row.series}-${row.number}` : row.type === "TICKET" ? "Por definir" : row.type}</p><p className="text-xs text-[#A1A1A1]">{row.type}</p></div> },
            { key: "customer", label: "Cliente", render: (row) => { const user = row.sale.customerProfile?.user; return <div><p className="font-medium text-[#29331a]">{user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Sin nombre" : "Clientes varios"}</p><p className="text-xs text-[#A1A1A1]">{user?.documentNumber ?? "Sin documento"}</p></div>; } },
            { key: "total", label: "Total", align: "right", render: (row) => <strong>S/ {row.sale.total.toFixed(2)}</strong> },
            { key: "status", label: "Estado", render: (row) => <div className="max-w-56"><Tag tone={statusTone(row.status)}>{statusLabel(row.status)}</Tag>{row.errorMessage ? <p className="mt-2 text-xs leading-5 text-[#925048]">{row.errorMessage}</p> : null}</div> },
          ]}
          actions={[
            { label: "Ver detalle", permission: "billing.documents.read", onClick: setDetailDocument },
            { label: "Emitir o reintentar", permission: "billing.documents.issue", icon: <SparkIcon />, tone: "accent", visible: (row) => row.status === "PENDING" || row.status === "FAILED", onClick: openIssue },
            { label: "Nota de crédito", permission: "billing.documents.adjust", icon: <FileMinus2 className="h-4 w-4" />, tone: "warn", visible: canIssueCreditNote, onClick: openCreditNote },
            { label: "Abrir PDF", icon: <ExternalLink className="h-4 w-4" />, visible: (row) => Boolean(row.pdfUrl), onClick: (row) => { if (row.pdfUrl) window.open(row.pdfUrl, "_blank", "noopener,noreferrer"); } },
            { label: "Imprimir PDF", permission: "billing.documents.print", icon: <Printer className="h-4 w-4" />, visible: (row) => Boolean(row.pdfUrl), onClick: printBillingPdf },
            { label: "Imprimir ticket", permission: "billing.documents.print", icon: <Printer className="h-4 w-4" />, visible: (row) => row.type === "TICKET", onClick: printBillingDocumentTicket },
          ]}
        />
      </PanelCard>

      <AdminOverlayPanel
        open={Boolean(selectedDocument)}
        onClose={() => !busy && setSelectedDocument(null)}
        eyebrow="Emisión fiscal"
        title="Emitir comprobante"
        description="La venta ya está registrada. Esta acción reserva el correlativo y envía el comprobante al proveedor fiscal activo."
        footer={<div className="flex justify-end gap-3"><AdminActionButton onClick={() => setSelectedDocument(null)} disabled={busy}>Cancelar</AdminActionButton><AdminActionButton tone="primary" icon={<FileCheck2 className="h-4 w-4" />} onClick={() => void confirmIssue()} disabled={busy}>Emitir ahora</AdminActionButton></div>}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[26px] border border-[#e7edd9] bg-[#F8F8F8] p-5"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#849252]">Venta</p><p className="mt-3 text-2xl font-semibold text-[#19210f]">{selectedDocument?.sale.saleNumber}</p><p className="mt-2 text-sm text-[#657052]">S/ {selectedDocument?.sale.total.toFixed(2)}</p></div>
          <label className="space-y-2"><span className="text-sm font-semibold">Tipo de comprobante</span><select className={inputClass} value={issueType} onChange={(event) => setIssueType(event.target.value as "BOLETA" | "FACTURA")} disabled={Boolean(selectedDocument?.series)}><option value="BOLETA">Boleta</option><option value="FACTURA">Factura</option></select><small className="block leading-5 text-[#6b7558]">La factura requiere un cliente registrado con RUC de 11 dígitos.</small></label>
        </div>
      </AdminOverlayPanel>

      <AdminOverlayPanel
        open={Boolean(creditNoteDocument)}
        onClose={() => !busy && setCreditNoteDocument(null)}
        eyebrow="Nota de crédito"
        title="Anular o corregir comprobante"
        description="La nota se emitirá sobre el comprobante original. Solo si reversas la operación se moverán stock, caja, puntos y estado de venta."
        footer={<div className="flex justify-end gap-3"><AdminActionButton onClick={() => setCreditNoteDocument(null)} disabled={busy}>Cancelar</AdminActionButton><AdminActionButton tone="danger" icon={<FileMinus2 className="h-4 w-4" />} onClick={() => void confirmCreditNote()} disabled={busy || !creditNoteReason.trim()}>Emitir nota</AdminActionButton></div>}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[26px] border border-[#e7edd9] bg-[#F8F8F8] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#849252]">Comprobante original</p>
            <p className="mt-3 text-2xl font-semibold text-[#19210f]">{documentName(creditNoteDocument)}</p>
            <p className="mt-2 text-sm text-[#657052]">Venta {creditNoteDocument?.sale.saleNumber} · S/ {creditNoteDocument?.sale.total.toFixed(2)}</p>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Motivo SUNAT</span>
            <select className={inputClass} value={creditNoteReasonCode} onChange={(event) => setCreditNoteReasonCode(event.target.value as "01" | "04" | "06" | "07")}>
              <option value="01">Anulación de la operación</option>
              <option value="04">Descuento global</option>
              <option value="06">Devolución total</option>
              <option value="07">Devolución por ítem</option>
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold">Sustento</span>
            <textarea className={`${inputClass} min-h-28 resize-none`} value={creditNoteReason} onChange={(event) => setCreditNoteReason(event.target.value)} placeholder="Ej. Cliente solicitó anulación total de la operación." maxLength={500} />
          </label>
          <label className="flex items-start gap-3 rounded-[24px] border border-[#E4E4E4] bg-white p-4 md:col-span-2">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[#00C70D]" checked={reverseSale} onChange={(event) => setReverseSale(event.target.checked)} />
            <span>
              <span className="block font-semibold text-[#0D0D0D]">Reversar operación completa</span>
              <span className="mt-1 block text-sm leading-6 text-[#535353]">Devuelve stock, registra salida en caja, revierte puntos y marca la venta como anulada. Si solo necesitas corregir fiscalmente sin tocar operación, desmárcalo.</span>
            </span>
          </label>
        </div>
      </AdminOverlayPanel>

      <AdminOverlayPanel
        open={Boolean(detailDocument)}
        onClose={() => setDetailDocument(null)}
        eyebrow="Auditoria fiscal"
        title={documentName(detailDocument)}
        description="Detalle operativo del comprobante y respuesta guardada del proveedor fiscal."
        footer={<div className="flex justify-end">
          <AdminActionButton onClick={() => setDetailDocument(null)}>Cerrar</AdminActionButton>
        </div>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-[var(--kapos-border)] bg-[var(--kapos-card-alt)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kapos-text-muted)]">Venta</p>
            <p className="mt-3 text-xl font-semibold text-[var(--kapos-text)]">{detailDocument?.sale.saleNumber}</p>
            <p className="mt-2 text-sm text-[var(--kapos-text-soft)]">{detailDocument?.sale.branch.name} · {detailDocument ? new Date(detailDocument.sale.soldAt).toLocaleString("es-PE") : ""}</p>
          </div>
          <div className="rounded-[24px] border border-[var(--kapos-border)] bg-[var(--kapos-card-alt)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kapos-text-muted)]">Estado</p>
            <div className="mt-3"><Tag tone={detailDocument ? statusTone(detailDocument.status) : "soft"}>{detailDocument ? statusLabel(detailDocument.status) : ""}</Tag></div>
            <p className="mt-2 text-sm text-[var(--kapos-text-soft)]">Total S/ {detailDocument?.sale.total.toFixed(2) ?? "0.00"}</p>
          </div>
          <div className="rounded-[24px] border border-[var(--kapos-border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kapos-text-muted)]">Cliente</p>
            <p className="mt-3 font-semibold text-[var(--kapos-text)]">{customerName(detailDocument)}</p>
            <p className="mt-2 text-sm text-[var(--kapos-text-soft)]">{detailDocument?.sale.customerProfile?.user.documentType ?? "Sin documento"} · {detailDocument?.sale.customerProfile?.user.documentNumber ?? "-"}</p>
          </div>
          <div className="rounded-[24px] border border-[var(--kapos-border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kapos-text-muted)]">Proveedor</p>
            <p className="mt-3 font-semibold text-[var(--kapos-text)]">{detailDocument?.provider ?? "Sin proveedor"}</p>
            <p className="mt-2 text-sm text-[var(--kapos-text-soft)]">ID externo: {detailDocument?.externalId ?? "-"}</p>
          </div>
        </div>

        {detailDocument?.errorMessage ? (
          <AdminMessage title="Motivo registrado" description={detailDocument.errorMessage} tone="warn" />
        ) : null}

        {detailDocument?.affectedDocument ? (
          <AdminMessage title="Documento relacionado" description={`Modifica ${detailDocument.affectedDocument.series}-${detailDocument.affectedDocument.number}. ${detailDocument.noteReason ?? ""}`} />
        ) : null}

        <div className="flex flex-wrap gap-3">
          {detailDocument?.pdfUrl ? <Link href={detailDocument.pdfUrl} target="_blank" rel="noreferrer"><AdminActionButton icon={<ExternalLink className="h-4 w-4" />} tone="accent">PDF</AdminActionButton></Link> : null}
          {detailDocument?.pdfUrl ? <AdminActionButton icon={<Printer className="h-4 w-4" />} onClick={() => printBillingPdf(detailDocument)}>Imprimir</AdminActionButton> : null}
          {detailDocument?.type === "TICKET" ? <AdminActionButton icon={<Printer className="h-4 w-4" />} onClick={() => printBillingDocumentTicket(detailDocument)}>Imprimir ticket</AdminActionButton> : null}
          {detailDocument?.xmlUrl ? <Link href={detailDocument.xmlUrl} target="_blank" rel="noreferrer"><AdminActionButton icon={<ExternalLink className="h-4 w-4" />}>XML</AdminActionButton></Link> : null}
          {detailDocument?.cdrUrl ? <Link href={detailDocument.cdrUrl} target="_blank" rel="noreferrer"><AdminActionButton icon={<ExternalLink className="h-4 w-4" />}>CDR</AdminActionButton></Link> : null}
        </div>

        <div className="rounded-[24px] border border-[var(--kapos-border)] bg-[var(--kapos-black)] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kapos-lime)]">Respuesta del proveedor</p>
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-white/80">
            {providerResponseText(detailDocument)}
          </pre>
        </div>
      </AdminOverlayPanel>
    </section>
  );
}
