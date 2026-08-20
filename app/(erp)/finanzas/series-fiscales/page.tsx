"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, ReceiptText, Trash2 } from "lucide-react";
import { AdminActionButton } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import { deleteBillingSeries, getBillingSeries, getBranches, updateBillingSeries, upsertBillingSeries } from "../../../lib/erp-api";
import type { BillingSeriesSummary, BranchSummary } from "../../../types/erp";

const inputClass =
  "w-full rounded-[18px] border border-[#dfe7cf] bg-white px-4 py-3 text-sm text-[#1f2813] outline-none transition focus:border-[#a9cf24]";

type SeriesFormMode = "create" | "edit";

export default function SeriesFiscalesPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [seriesRows, setSeriesRows] = useState<BillingSeriesSummary[]>([]);
  const [seriesForm, setSeriesForm] = useState({
    id: "",
    branchId: "",
    documentType: "BOLETA" as "BOLETA" | "FACTURA",
    series: "B001",
    nextNumber: "1",
    enabled: true,
  });
  const [seriesMode, setSeriesMode] = useState<SeriesFormMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canCreateSeries = effectivePermissionKeys.includes("billing.series.create");
  const canUpdateSeries = effectivePermissionKeys.includes("billing.series.update");
  const canDeleteSeries = effectivePermissionKeys.includes("billing.series.delete");

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadData() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setLoading(true);
    setError(null);
    try {
      const [branchRows, configuredSeries] = await Promise.all([
        getBranches({ accessToken: token, organizationId: activeOrganizationId }),
        getBillingSeries({ accessToken: token, organizationId: activeOrganizationId }),
      ]);
      setBranches(branchRows.filter((branch) => branch.status === "ACTIVE"));
      setSeriesRows(configuredSeries);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las series.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  function openCreateSeries() {
    setSeriesForm({
      id: "",
      branchId: branches[0]?.id ?? "",
      documentType: "BOLETA",
      series: "B001",
      nextNumber: "1",
      enabled: true,
    });
    setSeriesMode("create");
    setError(null);
  }

  function openEditSeries(row: BillingSeriesSummary) {
    setSeriesForm({
      id: row.id,
      branchId: row.branchId,
      documentType: row.documentType,
      series: row.series,
      nextNumber: String(row.nextNumber),
      enabled: row.enabled,
    });
    setSeriesMode("edit");
    setError(null);
  }

  async function submitSeries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !seriesMode) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        branchId: seriesForm.branchId,
        documentType: seriesForm.documentType,
        series: seriesForm.series.toUpperCase(),
        nextNumber: Number(seriesForm.nextNumber),
        enabled: seriesForm.enabled,
      };
      if (seriesMode === "create") {
        await upsertBillingSeries({ accessToken: token, organizationId: activeOrganizationId, body });
      } else {
        await updateBillingSeries({ accessToken: token, organizationId: activeOrganizationId, seriesId: seriesForm.id, body });
      }
      setSeriesMode(null);
      setSuccess(seriesMode === "create" ? "Serie creada." : "Serie actualizada.");
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar la serie.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSeries(row: BillingSeriesSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    if (!window.confirm(`¿Eliminar la serie ${row.series}?`)) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteBillingSeries({ accessToken: token, organizationId: activeOrganizationId, seriesId: row.id });
      setSuccess("Serie eliminada.");
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la serie.");
    } finally {
      setBusy(false);
    }
  }

  const activeSeries = seriesRows.filter((row) => row.enabled).length;

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Finanzas"
        title="Series fiscales"
        description="Controla series y correlativos por sucursal sin mezclar credenciales ni comprobantes."
        action={canCreateSeries ? <AdminActionButton tone="primary" icon={<ReceiptText className="h-4 w-4" />} onClick={openCreateSeries}>Crear serie</AdminActionButton> : <ReceiptText className="h-6 w-6 text-[#6d8a20]" />}
        stats={[
          { label: "Series", value: String(seriesRows.length), hint: "Boletas y facturas configuradas.", tone: "dark" },
          { label: "Activas", value: String(activeSeries), hint: "Disponibles para emitir.", tone: "accent" },
          { label: "Sucursales", value: String(branches.length), hint: "Sedes habilitadas para configurar." },
        ]}
      />

      {error ? <AdminMessage title="No se pudo completar la operación" description={error} tone="warn" /> : null}
      {success ? <AdminMessage title="Operación completada" description={success} tone="accent" /> : null}

      <PanelCard title="Correlativos por sucursal" description="Una serie usada por comprobantes ya no se elimina; se desactiva o se edita con cuidado.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {seriesRows.map((row) => (
            <article key={row.id} className="rounded-[20px] border border-[#e8eddd] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#849252]">{row.documentType}</p>
                  <h3 className="mt-1 text-2xl font-semibold text-[#1b2111]">{row.series}</h3>
                  <p className="mt-1 text-sm text-[#6b7558]">{row.branch.name}</p>
                </div>
                <Tag tone={row.enabled ? "accent" : "soft"}>{row.enabled ? "Activa" : "Inactiva"}</Tag>
              </div>
              <p className="mt-4 text-sm text-[#59634a]">Siguiente correlativo: <strong className="text-[#202914]">{row.nextNumber}</strong></p>
              <div className="mt-4 flex flex-wrap gap-2">
                {canUpdateSeries ? <AdminActionButton icon={<Pencil className="h-4 w-4" />} onClick={() => openEditSeries(row)}>Editar</AdminActionButton> : null}
                {canDeleteSeries ? <AdminActionButton tone="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => void removeSeries(row)} disabled={busy}>Eliminar</AdminActionButton> : null}
              </div>
            </article>
          ))}
        </div>
        {!loading && seriesRows.length === 0 ? <AdminMessage title="Sin series" description="Configura una serie B para boleta y una F para factura en cada sucursal que emitirá." /> : null}
      </PanelCard>

      <AdminOverlayPanel
        open={Boolean(seriesMode)}
        onClose={() => !busy && setSeriesMode(null)}
        eyebrow="Series"
        title={seriesMode === "create" ? "Crear serie" : "Editar serie"}
        description="El correlativo se reserva automáticamente al emitir. Ajusta el siguiente número solo cuando estés seguro."
        footer={<div className="flex justify-end gap-3"><AdminActionButton onClick={() => setSeriesMode(null)} disabled={busy}>Cancelar</AdminActionButton><AdminActionButton type="submit" form="billing-series-form" tone="primary" disabled={busy}>Guardar serie</AdminActionButton></div>}
      >
        <form id="billing-series-form" className="space-y-4" onSubmit={submitSeries}>
          <label className="space-y-2"><span className="text-sm font-semibold">Sucursal</span><select className={inputClass} value={seriesForm.branchId} onChange={(event) => setSeriesForm((current) => ({ ...current, branchId: event.target.value }))} required><option value="">Selecciona una sucursal</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-semibold">Comprobante</span><select className={inputClass} value={seriesForm.documentType} onChange={(event) => setSeriesForm((current) => ({ ...current, documentType: event.target.value as "BOLETA" | "FACTURA", series: event.target.value === "FACTURA" ? "F001" : "B001" }))}><option value="BOLETA">Boleta</option><option value="FACTURA">Factura</option></select></label>
            <label className="space-y-2"><span className="text-sm font-semibold">Serie</span><input className={inputClass} maxLength={4} value={seriesForm.series} onChange={(event) => setSeriesForm((current) => ({ ...current, series: event.target.value.toUpperCase() }))} required /></label>
          </div>
          <label className="space-y-2"><span className="text-sm font-semibold">Próximo correlativo</span><input className={inputClass} type="number" min="1" value={seriesForm.nextNumber} onChange={(event) => setSeriesForm((current) => ({ ...current, nextNumber: event.target.value }))} required /></label>
          <label className="flex items-center gap-3 rounded-[20px] border border-[#e6ebd9] bg-[#fafcf5] px-4 py-3 text-sm font-semibold"><input type="checkbox" checked={seriesForm.enabled} onChange={(event) => setSeriesForm((current) => ({ ...current, enabled: event.target.checked }))} /> Serie activa</label>
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
