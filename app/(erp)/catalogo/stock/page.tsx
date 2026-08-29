"use client";

import { useState } from "react";
import { AdminActionButton, ArrowLeftIcon, PencilIcon, PlusIcon } from "../../../components/admin/AdminActionButton";
import { AdminDataTable, createLocalAdminTableFetch } from "../../../components/admin/AdminDataTable";
import { AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { useAuth } from "../../../context/auth-context";
import { useToast } from "../../../context/toast-context";
import { getBranches, getProducts, getStock, getStockMovements, upsertStock } from "../../../lib/erp-api";
import type { BranchSummary, ProductStockSummary, ProductSummary, StockMovementSummary } from "../../../types/erp";

export default function CatalogoStockPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const toast = useToast();
  const [stock, setStock] = useState<ProductStockSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [reloadVersion, setReloadVersion] = useState(0);
  const reloadKey = `${activeOrganizationId ?? "none"}:${reloadVersion}`;
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [form, setForm] = useState({ productId: "", branchId: "", quantity: "0", minQuantity: "0", note: "" });

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

  async function fetchMovements(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    return getStockMovements({
      accessToken: token,
      organizationId: activeOrganizationId,
      page: input.page,
      limit: input.limit,
      search: input.search,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    try {
      await upsertStock({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          productId: form.productId,
          branchId: form.branchId,
          quantity: Number(form.quantity || "0"),
          minQuantity: Number(form.minQuantity || "0"),
          note: form.note || undefined,
        },
      });
      setForm({ productId: "", branchId: "", quantity: "0", minQuantity: "0", note: "" });
      setReloadVersion((current) => current + 1);
      setViewMode("table");
      toast.showSuccess("El stock fue actualizado correctamente.", "Stock actualizado");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "No se pudo actualizar el stock.";
      toast.showError(message, "No pudimos actualizar stock");
    }
  }

  function loadStockIntoForm(item: ProductStockSummary) {
    setForm({
      productId: item.productId,
      branchId: item.branchId,
      quantity: String(item.quantity),
      minQuantity: String(item.minQuantity),
      note: "",
    });
    setViewMode("create");
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Catalogo"
        title="Stock"
        description="Inventario por sucursal: existencia fisica menos unidades reservadas da el disponible para nuevas ventas."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? (
              <AdminActionButton onClick={() => setViewMode("table")} icon={<ArrowLeftIcon />} tone="ghost">
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton onClick={() => setViewMode("create")} icon={<PlusIcon />} tone="primary" active={viewMode === "create"}>
              Ajustar stock
            </AdminActionButton>
          </div>
        }
        stats={[
          { label: "Items con stock", value: String(stock.length), hint: "Producto por sucursal.", tone: "dark" },
          { label: "Bajo stock", value: String(stock.filter((item) => item.status === "LOW").length), hint: "Alertas iniciales.", tone: "accent" },
          { label: "Sin stock", value: String(stock.filter((item) => item.status === "OUT").length), hint: "No disponibles." },
        ]}
      />
      {viewMode === "create" ? (
        <PanelCard title="Ajustar stock" description="Registra stock inicial, correcciones, mermas o reposiciones. El movimiento queda en historial.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Producto</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} required><option value="">Selecciona producto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Sucursal</span><select className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} required><option value="">Selecciona sucursal</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Cantidad</span><input type="number" step="0.001" className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Stock minimo</span><input type="number" step="0.001" className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" value={form.minQuantity} onChange={(event) => setForm((current) => ({ ...current, minQuantity: event.target.value }))} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#0D0D0D]">Motivo</span><input className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]" placeholder="Compra, merma, conteo fisico..." value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
            <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Guardar ajuste</AdminActionButton></div>
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
              { key: "product", label: "Producto", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.product?.name ?? "Producto"}</p><p className="text-xs text-[#A1A1A1]">{row.product?.sku ?? "sin sku"}</p></div> },
              { key: "branch", label: "Sucursal", render: (row) => row.branch?.name ?? "Sin sucursal" },
              { key: "qty", label: "Existencia fisica", align: "right", render: (row) => row.quantity },
              { key: "reserved", label: "Reservado en pedidos", align: "right", render: (row) => row.reservedQuantity },
              { key: "available", label: "Disponible para venta", align: "right", render: (row) => row.availableQuantity },
              { key: "min", label: "Minimo", align: "right", render: (row) => row.minQuantity },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.status === "OK" ? "accent" : row.status === "LOW" ? "warn" : "dark"}>{row.status}</Tag> },
            ]}
            actions={[
              { label: "Ajustar stock", permission: "catalog.stock.update", icon: <PencilIcon />, onClick: loadStockIntoForm },
            ]}
          />
        </PanelCard>
      )}

      <PanelCard title="Historial de ajustes" description="Cada cambio manual queda trazado con sucursal, producto, usuario y saldo final.">
        <AdminDataTable<StockMovementSummary>
          fetchData={fetchMovements}
          reloadKey={`movements-${reloadKey}`}
          rowKey={(row) => row.id}
          permissionKeys={effectivePermissionKeys}
          searchPlaceholder="Buscar producto, sucursal o motivo..."
          emptyTitle="Sin movimientos"
          emptyDescription="Los ajustes manuales y descuentos por venta apareceran aqui."
          columns={[
            { key: "date", label: "Fecha", render: (row) => new Date(row.occurredAt).toLocaleString("es-PE") },
            { key: "product", label: "Producto", render: (row) => <div><p className="font-semibold text-[#0D0D0D]">{row.product?.name ?? "Producto"}</p><p className="text-xs text-[#A1A1A1]">{row.product?.sku ?? "sin sku"}</p></div> },
            { key: "branch", label: "Sucursal", render: (row) => row.branch?.name ?? "Sin sucursal" },
            { key: "type", label: "Tipo", render: (row) => <Tag tone={row.type === "ADJUSTMENT" ? "accent" : row.type === "SALE" ? "dark" : "warn"}>{row.type}</Tag> },
            { key: "quantity", label: "Cambio", align: "right", render: (row) => <strong className={row.quantity < 0 ? "text-[#d35b39]" : "text-[#00A70B]"}>{row.quantity > 0 ? "+" : ""}{row.quantity}</strong> },
            { key: "balance", label: "Saldo", align: "right", render: (row) => row.balanceAfter },
            { key: "note", label: "Motivo", render: (row) => row.note ?? "-" },
          ]}
        />
      </PanelCard>
    </section>
  );
}
