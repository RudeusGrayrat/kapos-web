"use client";

import { useState } from "react";
import { AdminActionButton, ArrowLeftIcon, PencilIcon, PlusIcon, TrashIcon } from "../../../components/admin/AdminActionButton";
import { AdminDataTable } from "../../../components/admin/AdminDataTable";
import { AdminMessage, AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import { useToast } from "../../../context/toast-context";
import { createProduct, getOrganizationProfile, getProductCategories, getProducts, updateProduct } from "../../../lib/erp-api";
import type { ProductCategorySummary, ProductSummary } from "../../../types/erp";

const DEFAULT_TAX_RATE = 18;

export default function CatalogoProductosPage() {
  const { accessToken, activeOrganizationId, effectivePermissionKeys, refreshSession } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<ProductCategorySummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [reloadVersion, setReloadVersion] = useState(0);
  const reloadKey = `${activeOrganizationId ?? "none"}:${reloadVersion}`;
  const [defaultTaxRate, setDefaultTaxRate] = useState(DEFAULT_TAX_RATE);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [autoCost, setAutoCost] = useState(true);
  const [autoEditCost, setAutoEditCost] = useState(true);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    description: "",
    price: "0",
    cost: "",
    taxRate: String(DEFAULT_TAX_RATE),
    type: "PRODUCT" as ProductSummary["type"],
    trackStock: true,
    availableForPos: true,
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    description: "",
    price: "0",
    cost: "",
    taxRate: String(DEFAULT_TAX_RATE),
    type: "PRODUCT" as ProductSummary["type"],
    status: "ACTIVE" as ProductSummary["status"],
    trackStock: true,
    availableForPos: true,
  });

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  function calculateBaseWithoutTax(priceValue: string, taxRateValue: string | number) {
    const price = Number(priceValue || "0");
    const taxRate = Number(taxRateValue || "0");

    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(taxRate) || taxRate < 0) {
      return "";
    }

    return (price / (1 + taxRate / 100)).toFixed(2);
  }

  function calculateTaxAmount(priceValue: string, taxRateValue: string | number) {
    const price = Number(priceValue || "0");
    const baseWithoutTax = Number(calculateBaseWithoutTax(priceValue, taxRateValue) || "0");

    if (!Number.isFinite(price) || price <= 0) {
      return "";
    }

    return Math.max(0, price - baseWithoutTax).toFixed(2);
  }

  function updateCreatePrice(price: string) {
    setForm((current) => ({
      ...current,
      price,
      cost: autoCost
        ? calculateBaseWithoutTax(price, current.taxRate)
        : current.cost,
    }));
  }

  function updateCreateTaxRate(taxRate: string) {
    setForm((current) => ({
      ...current,
      taxRate,
      cost: autoCost
        ? calculateBaseWithoutTax(current.price, taxRate)
        : current.cost,
    }));
  }

  function updateEditPrice(price: string) {
    setEditForm((current) => ({
      ...current,
      price,
      cost: autoEditCost
        ? calculateBaseWithoutTax(price, current.taxRate)
        : current.cost,
    }));
  }

  function updateEditTaxRate(taxRate: string) {
    setEditForm((current) => ({
      ...current,
      taxRate,
      cost: autoEditCost
        ? calculateBaseWithoutTax(current.price, taxRate)
        : current.cost,
    }));
  }

  async function fetchProducts(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const [productResponse, categoryResponse, organizationResponse] = await Promise.all([
      getProducts({ accessToken: token, organizationId: activeOrganizationId, ...input }),
      getProductCategories({ accessToken: token, organizationId: activeOrganizationId }),
      getOrganizationProfile({ accessToken: token, organizationId: activeOrganizationId }).catch(() => null),
    ]);
    if (organizationResponse) {
      const configuredTaxRate = organizationResponse.settings.taxRate;
      setDefaultTaxRate(configuredTaxRate);
      setForm((current) => current.price === "0" && current.cost === ""
        ? { ...current, taxRate: String(configuredTaxRate) }
        : current);
    }
    setProducts(productResponse.data);
    setCategories(categoryResponse);
    return { data: productResponse.data, total: productResponse.total };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await createProduct({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          name: form.name,
          sku: form.sku || undefined,
          categoryId: form.categoryId || undefined,
          description: form.description || undefined,
          price: Number(form.price || "0"),
          cost: form.cost ? Number(form.cost) : undefined,
          taxRate: Number(form.taxRate || "0"),
          type: form.type,
          trackStock: form.trackStock,
          availableForPos: form.availableForPos,
        },
      });
      setForm({
        name: "",
        sku: "",
        categoryId: "",
        description: "",
        price: "0",
        cost: "",
        taxRate: String(defaultTaxRate),
        type: "PRODUCT",
        trackStock: true,
        availableForPos: true,
      });
      setReloadVersion((current) => current + 1);
      setViewMode("table");
      toast.showSuccess("El producto fue creado correctamente.", "Producto creado");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "No se pudo crear el producto.";
      setError(message);
      toast.showError(message, "No se pudo crear");
    }
  }

  function openProductEditor(product: ProductSummary) {
    const taxRate = String(product.taxRate ?? defaultTaxRate);
    setAutoEditCost(true);
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      sku: product.sku ?? "",
      categoryId: product.categoryId ?? "",
      description: product.description ?? "",
      price: String(product.price),
      cost: product.cost === null
        ? calculateBaseWithoutTax(String(product.price), taxRate)
        : String(product.cost),
      taxRate,
      type: product.type,
      status: product.status,
      trackStock: product.trackStock,
      availableForPos: product.availableForPos,
    });
  }

  async function handleUpdateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedProduct) return;
    setError(null);
    try {
      await updateProduct({
        accessToken: token,
        organizationId: activeOrganizationId,
        productId: selectedProduct.id,
        body: {
          name: editForm.name,
          sku: editForm.sku || undefined,
          categoryId: editForm.categoryId || undefined,
          description: editForm.description || undefined,
          price: Number(editForm.price || "0"),
          cost: editForm.cost ? Number(editForm.cost) : undefined,
          taxRate: Number(editForm.taxRate || "0"),
          type: editForm.type,
          status: editForm.status,
          trackStock: editForm.trackStock,
          availableForPos: editForm.availableForPos,
        },
      });
      setSelectedProduct(null);
      setReloadVersion((current) => current + 1);
      toast.showSuccess("Los cambios del producto fueron guardados.", "Producto actualizado");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "No se pudo editar el producto.";
      setError(message);
      toast.showError(message, "No se pudo editar");
    }
  }

  async function toggleProductStatus(product: ProductSummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await updateProduct({
        accessToken: token,
        organizationId: activeOrganizationId,
        productId: product.id,
        body: { status: product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
      });
      setReloadVersion((current) => current + 1);
      toast.showSuccess("El estado del producto fue actualizado.", "Estado actualizado");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "No se pudo cambiar el estado del producto.";
      setError(message);
      toast.showError(message, "No se pudo actualizar");
    }
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Catalogo"
        title="Productos"
        description="Productos, insumos, servicios y combos que luego consumira el POS."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? (
              <AdminActionButton
                onClick={() => setViewMode("table")}
                icon={<ArrowLeftIcon />}
                tone="ghost"
              >
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton
              onClick={() => setViewMode("create")}
              icon={<PlusIcon />}
              tone="primary"
              active={viewMode === "create"}
            >
              Crear producto
            </AdminActionButton>
          </div>
        }
        stats={[
          { label: "Productos", value: String(products.length), hint: "Pagina actual.", tone: "dark" },
          { label: "Categorias", value: String(categories.length), hint: "Clasificacion disponible.", tone: "accent" },
          { label: "Para POS", value: String(products.filter((product) => product.availableForPos).length), hint: "Visibles para vender." },
        ]}
      />
      {error ? <AdminMessage title="No pudimos crear el producto" description={error} tone="warn" /> : null}
      {viewMode === "create" ? (
        <PanelCard title="Crear producto" description="Alta rapida. Variantes y modificadores vendran en el siguiente bloque.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">SKU</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Descripcion</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Categoria</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Sin categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Tipo</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ProductSummary["type"] }))}>{["PRODUCT", "SERVICE", "INGREDIENT", "COMBO"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Precio de venta</span><input type="number" step="0.01" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.price} onChange={(event) => updateCreatePrice(event.target.value)} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Tasa IGV (%)</span><input type="number" min="0" step="0.01" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.taxRate} placeholder="18.00" onChange={(event) => updateCreateTaxRate(event.target.value)} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Costo referencial/base sin IGV</span><input type="number" min="0" step="0.01" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.cost} onChange={(event) => { setAutoCost(false); setForm((current) => ({ ...current, cost: event.target.value })); }} /><span className="block text-xs font-medium text-[#7a845f]">{autoCost ? "Se calcula automaticamente desde el precio." : "Editado manualmente."}</span></label>
            <div className="rounded-[20px] border border-[#e2e8d0] bg-[#fbfcf8] px-4 py-3 text-sm text-[#53613d]">
              <p>Base sin IGV: S/ {calculateBaseWithoutTax(form.price, form.taxRate) || "0.00"}</p>
              <p>IGV incluido: S/ {calculateTaxAmount(form.price, form.taxRate) || "0.00"}</p>
              <AdminActionButton
                className="mt-3"
                size="sm"
                tone="ghost"
                onClick={() => {
                  setAutoCost(true);
                  setForm((current) => ({
                    ...current,
                    taxRate: String(defaultTaxRate),
                    cost: calculateBaseWithoutTax(current.price, defaultTaxRate),
                  }));
                }}
              >
                Recalcular con {defaultTaxRate}%
              </AdminActionButton>
            </div>
            <label className="flex items-center gap-3 rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm font-semibold text-[#21300f]"><input type="checkbox" checked={form.availableForPos} onChange={(event) => setForm((current) => ({ ...current, availableForPos: event.target.checked }))} />Disponible para POS</label>
            <label className="flex items-center gap-3 rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm font-semibold text-[#21300f]"><input type="checkbox" checked={form.trackStock} onChange={(event) => setForm((current) => ({ ...current, trackStock: event.target.checked }))} />Controla stock</label>
            <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Crear producto</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Tabla de productos" description="Listado real con busqueda y paginacion desde backend.">
          <AdminDataTable
            fetchData={fetchProducts}
            reloadKey={reloadKey}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar producto, SKU o categoria..."
            emptyTitle="Aun no hay productos"
            emptyDescription="Crea productos para empezar a preparar POS e inventario."
            columns={[
              { key: "name", label: "Producto", render: (row) => <div><p className="font-semibold text-[#1b2111]">{row.name}</p><p className="text-xs text-[#7a845f]">{row.sku ?? "sin sku"}</p></div> },
              { key: "category", label: "Categoria", render: (row) => row.category?.name ?? "Sin categoria" },
              { key: "type", label: "Tipo", render: (row) => row.type },
              { key: "price", label: "Precio", align: "right", render: (row) => `S/ ${row.price.toFixed(2)}` },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.status === "ACTIVE" ? "accent" : "soft"}>{row.status}</Tag> },
            ]}
            actions={[
              { label: "Editar", permission: "catalog.products.update", icon: <PencilIcon />, onClick: openProductEditor },
              { label: "Activar", permission: "catalog.products.activate", tone: "accent", icon: <PlusIcon />, visible: (row) => row.status !== "ACTIVE", onClick: toggleProductStatus },
              { label: "Desactivar", permission: "catalog.products.update", tone: "warn", icon: <TrashIcon />, visible: (row) => row.status === "ACTIVE", onClick: toggleProductStatus },
            ]}
          />
        </PanelCard>
      )}

      <AdminOverlayPanel
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        eyebrow="Producto"
        title="Editar producto"
        description="Los productos no se eliminan fisicamente; se desactivan o archivan para conservar ventas, stock y reportes."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedProduct(null)}>Cancelar</AdminActionButton>
            <AdminActionButton tone="primary" onClick={() => (document.getElementById("product-edit-form") as HTMLFormElement | null)?.requestSubmit()}>Guardar cambios</AdminActionButton>
          </div>
        }
      >
        <form id="product-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateProduct}>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">SKU</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.sku} onChange={(event) => setEditForm((current) => ({ ...current, sku: event.target.value }))} /></label>
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#21300f]">Descripcion</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Categoria</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.categoryId} onChange={(event) => setEditForm((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Sin categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Tipo</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.type} onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value as ProductSummary["type"] }))}>{["PRODUCT", "SERVICE", "INGREDIENT", "COMBO"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Precio de venta</span><input type="number" min="0" step="0.01" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.price} onChange={(event) => updateEditPrice(event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Costo referencial/base sin IGV</span><input type="number" min="0" step="0.01" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.cost} onChange={(event) => { setAutoEditCost(false); setEditForm((current) => ({ ...current, cost: event.target.value })); }} /><span className="block text-xs font-medium text-[#7a845f]">{autoEditCost ? "Se recalcula al cambiar el precio." : "Editado manualmente."}</span></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Tasa IGV (%)</span><input type="number" min="0" step="0.01" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.taxRate} onChange={(event) => updateEditTaxRate(event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Estado</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as ProductSummary["status"] }))}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="ARCHIVED">Archivado</option></select></label>
          <div className="rounded-[20px] border border-[#e2e8d0] bg-[#fbfcf8] px-4 py-3 text-sm text-[#53613d] md:col-span-2">
            <p>Base sin IGV: S/ {calculateBaseWithoutTax(editForm.price, editForm.taxRate) || "0.00"}</p>
            <p>IGV incluido: S/ {calculateTaxAmount(editForm.price, editForm.taxRate) || "0.00"}</p>
            <AdminActionButton
              className="mt-3"
              size="sm"
              tone="ghost"
              onClick={() => {
                setAutoEditCost(true);
                setEditForm((current) => ({
                  ...current,
                  taxRate: String(defaultTaxRate),
                  cost: calculateBaseWithoutTax(current.price, defaultTaxRate),
                }));
              }}
            >
              Recalcular con {defaultTaxRate}%
            </AdminActionButton>
          </div>
          <label className="flex items-center gap-3 rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm font-semibold text-[#21300f]"><input type="checkbox" checked={editForm.availableForPos} onChange={(event) => setEditForm((current) => ({ ...current, availableForPos: event.target.checked }))} />Disponible para POS</label>
          <label className="flex items-center gap-3 rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm font-semibold text-[#21300f]"><input type="checkbox" checked={editForm.trackStock} onChange={(event) => setEditForm((current) => ({ ...current, trackStock: event.target.checked }))} />Controla stock</label>
        </form>
      </AdminOverlayPanel>
    </section>
  );
}
