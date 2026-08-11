"use client";

import { useEffect, useState } from "react";
import { AdminActionButton, ArrowLeftIcon, PencilIcon, PlusIcon } from "../../../components/admin/AdminActionButton";
import { AdminDataTable, createLocalAdminTableFetch } from "../../../components/admin/AdminDataTable";
import { AdminMessage, AdminPageHeader, PanelCard, StatCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { useToast } from "../../../context/toast-context";
import { getBranches, getProducts, getStock, upsertStock } from "../../../lib/erp-api";
import type { BranchSummary, ProductStockSummary, ProductSummary } from "../../../types/erp";

export default function CatalogoStockPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const toast = useToast();
  const [stock, setStock] = useState<ProductStockSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [form, setForm] = useState({ productId: "", branchId: "", quantity: "0", minQuantity: "0" });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function fetchStock(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const [stockRows, productResponse, branchRows] = await Promise.all([
      getStock({ accessToken: token, organizationId: activeOrganizationId }),
      getProducts({ accessToken: token, organizationId: activeOrganizationId, page: 1, limit: 100 }),
      getBranches({ accessToken: token, organizationId: activeOrganizationId }),
    ]);
    setStock(stockRows);
    setProducts(productResponse.data);
    setBranches(branchRows);
    return createLocalAdminTableFetch({
      getRows: () => stockRows,
      filterRow: (item, search) => [item.product?.name, item.product?.sku, item.branch?.name, item.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  useEffect(() => setReloadKey((current) => current + 1), [activeOrganizationId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await upsertStock({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          productId: form.productId,
          branchId: form.branchId,
          quantity: Number(form.quantity || "0"),
          minQuantity: Number(form.minQuantity || "0"),
        },
      });
      setForm({ productId: "", branchId: "", quantity: "0", minQuantity: "0" });
      setReloadKey((current) => current + 1);
      setViewMode("table");
      toast.showSuccess("El stock fue actualizado correctamente.", "Stock actualizado");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "No se pudo actualizar el stock.";
      setError(message);
      toast.showError(message, "No pudimos actualizar stock");
    }
  }

  function loadStockIntoForm(item: ProductStockSummary) {
    setForm({
      productId: item.productId,
      branchId: item.branchId,
      quantity: String(item.quantity),
      minQuantity: String(item.minQuantity),
    });
    setViewMode("create");
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        eyebrow="Catalogo"
        title="Stock"
        description="Existencias iniciales por sucursal. Luego agregaremos kardex y movimientos auditables."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? (
              <AdminActionButton onClick={() => setViewMode("table")} icon={<ArrowLeftIcon />} tone="ghost">
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton onClick={() => setViewMode("create")} icon={<PlusIcon />} tone="primary" active={viewMode === "create"}>
              Actualizar stock
            </AdminActionButton>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Items con stock" value={String(stock.length)} hint="Producto por sucursal." tone="dark" />
        <StatCard label="Bajo stock" value={String(stock.filter((item) => item.status === "LOW").length)} hint="Alertas iniciales." tone="accent" />
        <StatCard label="Sin stock" value={String(stock.filter((item) => item.status === "OUT").length)} hint="No disponibles." />
      </div>
      {error ? <AdminMessage title="No pudimos actualizar stock" description={error} tone="warn" /> : null}
      {viewMode === "create" ? (
        <PanelCard title="Actualizar stock" description="Stock inicial manual para dejar listo el POS.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Producto</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} required><option value="">Selecciona producto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Sucursal</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} required><option value="">Selecciona sucursal</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Cantidad</span><input type="number" step="0.001" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Stock minimo</span><input type="number" step="0.001" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.minQuantity} onChange={(event) => setForm((current) => ({ ...current, minQuantity: event.target.value }))} /></label>
            <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Guardar stock</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Tabla de stock" description="Estado actual por producto y sucursal.">
          <AdminDataTable
            fetchData={fetchStock}
            reloadKey={reloadKey}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar producto o sucursal..."
            emptyTitle="Aun no hay stock"
            emptyDescription="Crea productos y sucursales, luego registra stock inicial."
            columns={[
              { key: "product", label: "Producto", render: (row) => <div><p className="font-semibold text-[#1b2111]">{row.product?.name ?? "Producto"}</p><p className="text-xs text-[#7a845f]">{row.product?.sku ?? "sin sku"}</p></div> },
              { key: "branch", label: "Sucursal", render: (row) => row.branch?.name ?? "Sin sucursal" },
              { key: "qty", label: "Cantidad", align: "right", render: (row) => row.quantity },
              { key: "min", label: "Minimo", align: "right", render: (row) => row.minQuantity },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.status === "OK" ? "accent" : row.status === "LOW" ? "warn" : "dark"}>{row.status}</Tag> },
            ]}
            actions={[
              { label: "Editar stock", permission: "catalog.stock.update", icon: <PencilIcon />, onClick: loadStockIntoForm },
            ]}
          />
        </PanelCard>
      )}
    </section>
  );
}
