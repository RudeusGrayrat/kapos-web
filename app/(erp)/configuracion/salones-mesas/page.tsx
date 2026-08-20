"use client";

import { useEffect, useState } from "react";
import { Armchair, Building2, MapPinned, Users } from "lucide-react";
import { AdminActionButton, PlusIcon } from "../../../components/admin/AdminActionButton";
import {
  AdminMessage,
  AdminModuleHeader,
  PanelCard,
  Tag,
} from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import {
  createDiningArea,
  createDiningTable,
  getBranches,
  getDiningAreas,
  updateDiningArea,
  updateDiningTable,
} from "../../../lib/erp-api";
import type { BranchSummary, DiningAreaSummary } from "../../../types/erp";

const inputClass =
  "w-full rounded-[18px] border border-[#dfe7cf] bg-white px-4 py-3 text-sm text-[#1f2813] outline-none transition focus:border-[#a9cf24]";

export default function AreasMesasPage() {
  const {
    accessToken,
    activeOrganizationId,
    effectivePermissionKeys,
    refreshSession,
  } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [branchId, setBranchId] = useState("");
  const [areas, setAreas] = useState<DiningAreaSummary[]>([]);
  const [areaName, setAreaName] = useState("");
  const [tableForm, setTableForm] = useState({
    areaId: "",
    code: "",
    name: "",
    capacity: "2",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canCreate = effectivePermissionKeys.includes("settings.tables.create");
  const canUpdate = effectivePermissionKeys.includes("settings.tables.update");

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function reload(nextBranchId = branchId) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !nextBranchId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await getDiningAreas({
        accessToken: token,
        organizationId: activeOrganizationId,
        branchId: nextBranchId,
      });
      setAreas(rows);
      setTableForm((current) => ({
        ...current,
        areaId: rows.some((area) => area.id === current.areaId)
          ? current.areaId
          : (rows.find((area) => area.isActive)?.id ?? ""),
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la distribución.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const token = await resolveToken();
      if (!token || !activeOrganizationId) return;
      try {
        const rows = await getBranches({ accessToken: token, organizationId: activeOrganizationId });
        if (!mounted) return;
        const activeBranches = rows.filter((branch) => branch.status === "ACTIVE");
        const nextBranchId = activeBranches[0]?.id ?? "";
        setBranches(activeBranches);
        setBranchId(nextBranchId);
        if (nextBranchId) await reload(nextBranchId);
        else setLoading(false);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las sucursales.");
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // La organización activa reinicia por completo el contexto de sede.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId]);

  async function handleCreateArea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !branchId || !areaName.trim()) return;
    setError(null);
    try {
      await createDiningArea({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: { branchId, name: areaName.trim(), sortOrder: areas.length },
      });
      setAreaName("");
      await reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear el área.");
    }
  }

  async function handleCreateTable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !branchId || !tableForm.areaId) return;
    setError(null);
    try {
      await createDiningTable({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          branchId,
          areaId: tableForm.areaId,
          code: tableForm.code.trim(),
          name: tableForm.name.trim(),
          capacity: Number(tableForm.capacity),
        },
      });
      setTableForm((current) => ({ ...current, code: "", name: "", capacity: "2" }));
      await reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la mesa.");
    }
  }

  async function toggleArea(area: DiningAreaSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    try {
      await updateDiningArea({
        accessToken: token,
        organizationId: activeOrganizationId,
        areaId: area.id,
        body: { isActive: !area.isActive },
      });
      await reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo actualizar el área.");
    }
  }

  async function toggleTable(tableId: string, isActive: boolean) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    try {
      await updateDiningTable({
        accessToken: token,
        organizationId: activeOrganizationId,
        tableId,
        body: { isActive: !isActive },
      });
      await reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo actualizar la mesa.");
    }
  }

  const tables = areas.flatMap((area) => area.tables);
  const occupied = tables.filter((table) => table.activeAccount).length;

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Configuración operativa"
        title="Áreas y mesas"
        description="Modela la distribución de cada sede. La operación diaria y las cuentas abiertas se gestionan desde Ventas, no desde esta pantalla."
        action={
          <select
            className={`${inputClass} min-w-64`}
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              void reload(event.target.value);
            }}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        }
        stats={[
          { label: "Áreas", value: String(areas.length), hint: "Zonas configuradas en esta sede.", tone: "dark" },
          { label: "Mesas", value: String(tables.length), hint: "Puntos de atención disponibles.", tone: "accent" },
          { label: "Ocupadas ahora", value: String(occupied), hint: "Calculado desde cuentas abiertas reales." },
        ]}
      />

      {error ? <AdminMessage title="No se pudo completar la operación" description={error} tone="warn" /> : null}
      {!branchId ? <AdminMessage title="Primero crea una sucursal" description="Las áreas y mesas siempre pertenecen a una sede concreta." /> : null}

      {canCreate && branchId ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <PanelCard title="Nueva área" description="Principal se crea automáticamente. Agrega terraza o segundo piso solo si lo necesitas.">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateArea}>
              <input className={inputClass} placeholder="Ej. Terraza" value={areaName} onChange={(event) => setAreaName(event.target.value)} required />
              <AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Crear área</AdminActionButton>
            </form>
          </PanelCard>
          <PanelCard title="Nueva mesa" description="El código debe ser único dentro de la sucursal.">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreateTable}>
              <select className={inputClass} value={tableForm.areaId} onChange={(event) => setTableForm((current) => ({ ...current, areaId: event.target.value }))} required>
                <option value="">Seleccionar área</option>
                {areas.filter((area) => area.isActive).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
              <input className={inputClass} placeholder="Código: M07" value={tableForm.code} onChange={(event) => setTableForm((current) => ({ ...current, code: event.target.value }))} required />
              <input className={inputClass} placeholder="Nombre: Mesa 7" value={tableForm.name} onChange={(event) => setTableForm((current) => ({ ...current, name: event.target.value }))} required />
              <input className={inputClass} type="number" min="1" placeholder="Capacidad" value={tableForm.capacity} onChange={(event) => setTableForm((current) => ({ ...current, capacity: event.target.value }))} required />
              <div className="sm:col-span-2 sm:text-right"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Crear mesa</AdminActionButton></div>
            </form>
          </PanelCard>
        </div>
      ) : null}

      <PanelCard title="Distribución de la sede" description="El estado ocupado se deriva de la cuenta abierta y no se edita manualmente.">
        {loading ? <p className="py-10 text-center text-sm text-[#667053]">Cargando distribución...</p> : null}
        {!loading && areas.length === 0 ? <AdminMessage title="Preparando el área principal" description="Actualiza la página para comenzar a agregar mesas." /> : null}
        <div className="space-y-6">
          {areas.map((area) => (
            <article key={area.id} className="rounded-[28px] border border-[#e5ead8] bg-[#fbfcf7] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eff7d1] text-[#4b6517]"><MapPinned className="h-5 w-5" /></span>
                  <div><h3 className="text-lg font-semibold text-[#1a210f]">{area.name}</h3><p className="text-sm text-[#6b745d]">{area.tables.length} mesas</p></div>
                </div>
                <div className="flex items-center gap-2"><Tag tone={area.isActive ? "accent" : "soft"}>{area.isActive ? "Activo" : "Inactivo"}</Tag>{canUpdate ? <AdminActionButton size="sm" tone="ghost" onClick={() => void toggleArea(area)}>{area.isActive ? "Desactivar" : "Activar"}</AdminActionButton> : null}</div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {area.tables.map((table) => (
                  <div key={table.id} className={`rounded-[24px] border p-4 ${table.activeAccount ? "border-[#c7df72] bg-[#f7fcdF]" : "border-[#e5ead8] bg-white"}`}>
                    <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f1f4ea] text-[#53623b]"><Armchair className="h-5 w-5" /></span><Tag tone={table.activeAccount ? "warn" : table.isActive ? "accent" : "soft"}>{table.activeAccount ? "Ocupada" : table.isActive ? "Libre" : "Inactiva"}</Tag></div>
                    <p className="mt-4 text-lg font-semibold text-[#1b2111]">{table.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#70795f]"><span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{table.code}</span><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{table.capacity}</span></div>
                    {table.activeAccount ? <p className="mt-3 text-sm font-semibold text-[#415515]">Saldo S/ {table.activeAccount.balance.toFixed(2)}</p> : null}
                    {canUpdate && !table.activeAccount ? <AdminActionButton className="mt-3" size="sm" tone="ghost" onClick={() => void toggleTable(table.id, table.isActive)}>{table.isActive ? "Desactivar" : "Activar"}</AdminActionButton> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </PanelCard>
    </section>
  );
}
