"use client";

import { useEffect, useState } from "react";
import {
  AdminActionButton,
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "../../../components/admin/AdminActionButton";
import {
  AdminDataTable,
  createLocalAdminTableFetch,
} from "../../../components/admin/AdminDataTable";
import {
  AdminMessage,
  AdminPageHeader,
  PanelCard,
  StatCard,
  Tag,
} from "../../../components/admin/AdminBlocks";
import { AdminOverlayPanel } from "../../../components/admin/AdminOverlayPanel";
import { useAuth } from "../../../context/auth-context";
import {
  createProductCategory,
  getProductCategories,
  updateProductCategory,
} from "../../../lib/erp-api";
import type { ProductCategorySummary } from "../../../types/erp";

type CategoryForm = {
  name: string;
  description: string;
  color: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_FORM: CategoryForm = {
  name: "",
  description: "",
  color: "#b4e610",
  sortOrder: "0",
  isActive: true,
};

export default function CatalogoCategoriasPage() {
  const {
    accessToken,
    activeOrganizationId,
    effectivePermissionKeys,
    refreshSession,
  } = useAuth();
  const [categories, setCategories] = useState<ProductCategorySummary[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "create">("table");
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategorySummary | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm | null>(null);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function fetchCategories(input: { page: number; limit: number; search: string }) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) throw new Error("No hay organizacion activa.");
    const rows = await getProductCategories({ accessToken: token, organizationId: activeOrganizationId });
    setCategories(rows);
    return createLocalAdminTableFetch({
      getRows: () => rows,
      filterRow: (category, search) =>
        [category.name, category.slug, category.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
    })(input);
  }

  useEffect(() => setReloadKey((current) => current + 1), [activeOrganizationId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await createProductCategory({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          name: form.name,
          description: form.description || undefined,
          color: form.color,
          sortOrder: Number(form.sortOrder || "0"),
          isActive: true,
        },
      });
      setForm(EMPTY_FORM);
      setReloadKey((current) => current + 1);
      setViewMode("table");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la categoria.");
    }
  }

  function openCategoryEditor(category: ProductCategorySummary) {
    setSelectedCategory(category);
    setEditForm({
      name: category.name,
      description: category.description ?? "",
      color: category.color ?? "#b4e610",
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
  }

  async function handleUpdateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId || !selectedCategory || !editForm) return;
    setError(null);
    try {
      await updateProductCategory({
        accessToken: token,
        organizationId: activeOrganizationId,
        categoryId: selectedCategory.id,
        body: {
          name: editForm.name,
          description: editForm.description || undefined,
          color: editForm.color,
          sortOrder: Number(editForm.sortOrder || "0"),
          isActive: editForm.isActive,
        },
      });
      setSelectedCategory(null);
      setEditForm(null);
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo editar la categoria.");
    }
  }

  async function toggleCategoryStatus(category: ProductCategorySummary) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setError(null);
    try {
      await updateProductCategory({
        accessToken: token,
        organizationId: activeOrganizationId,
        categoryId: category.id,
        body: { isActive: !category.isActive },
      });
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo cambiar el estado de la categoria.");
    }
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        eyebrow="Catalogo"
        title="Categorias"
        description="Orden visual y operativo para productos, POS y reportes."
        action={
          <div className="flex gap-3">
            {viewMode === "create" ? (
              <AdminActionButton onClick={() => setViewMode("table")} icon={<ArrowLeftIcon />} tone="ghost">
                Volver a la tabla
              </AdminActionButton>
            ) : null}
            <AdminActionButton onClick={() => setViewMode("create")} icon={<PlusIcon />} tone="primary" active={viewMode === "create"}>
              Crear categoria
            </AdminActionButton>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Categorias" value={String(categories.length)} hint="Familias creadas." tone="dark" />
        <StatCard label="Activas" value={String(categories.filter((category) => category.isActive).length)} hint="Visibles para operar." tone="accent" />
        <StatCard label="Productos" value={String(categories.reduce((sum, category) => sum + (category._count?.products ?? 0), 0))} hint="Productos clasificados." />
      </div>
      {error ? <AdminMessage title="No pudimos completar la accion" description={error} tone="warn" /> : null}
      {viewMode === "create" ? (
        <PanelCard title="Crear categoria" description="Ejemplos: waffles, batidos, toppings, bebidas.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Descripcion</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <div className="flex justify-end"><AdminActionButton type="submit" tone="primary" icon={<PlusIcon />}>Crear categoria</AdminActionButton></div>
          </form>
        </PanelCard>
      ) : (
        <PanelCard title="Tabla de categorias" description="Listado real para organizar productos.">
          <AdminDataTable
            fetchData={fetchCategories}
            reloadKey={reloadKey}
            rowKey={(row) => row.id}
            permissionKeys={effectivePermissionKeys}
            searchPlaceholder="Buscar categoria..."
            emptyTitle="Aun no hay categorias"
            emptyDescription="Crea categorias para ordenar el catalogo."
            columns={[
              { key: "name", label: "Categoria", render: (row) => <div><p className="font-semibold text-[#1b2111]">{row.name}</p><p className="text-xs text-[#7a845f]">{row.slug}</p></div> },
              { key: "products", label: "Productos", align: "center", render: (row) => row._count?.products ?? 0 },
              { key: "order", label: "Orden", align: "center", render: (row) => row.sortOrder },
              { key: "status", label: "Estado", render: (row) => <Tag tone={row.isActive ? "accent" : "soft"}>{row.isActive ? "Activa" : "Inactiva"}</Tag> },
            ]}
            actions={[
              { label: "Editar", permission: "catalog.categories.update", icon: <PencilIcon />, onClick: openCategoryEditor },
              { label: "Activar", permission: "catalog.categories.activate", tone: "accent", icon: <PlusIcon />, visible: (row) => !row.isActive, onClick: toggleCategoryStatus },
              { label: "Desactivar", permission: "catalog.categories.update", tone: "warn", icon: <TrashIcon />, visible: (row) => row.isActive, onClick: toggleCategoryStatus },
            ]}
          />
        </PanelCard>
      )}

      <AdminOverlayPanel
        open={Boolean(selectedCategory)}
        onClose={() => setSelectedCategory(null)}
        eyebrow="Categoria"
        title="Editar categoria"
        description="La categoria no se elimina fisicamente; si ya no se usa, se desactiva."
        footer={
          <div className="flex justify-end gap-3">
            <AdminActionButton tone="ghost" onClick={() => setSelectedCategory(null)}>Cancelar</AdminActionButton>
            <AdminActionButton tone="primary" onClick={() => document.getElementById("category-edit-form") instanceof HTMLFormElement && (document.getElementById("category-edit-form") as HTMLFormElement).requestSubmit()}>Guardar cambios</AdminActionButton>
          </div>
        }
      >
        {editForm ? (
          <form id="category-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateCategory}>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Nombre</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.name} onChange={(event) => setEditForm((current) => current ? { ...current, name: event.target.value } : current)} required /></label>
            <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-[#21300f]">Descripcion</span><input className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.description} onChange={(event) => setEditForm((current) => current ? { ...current, description: event.target.value } : current)} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Orden</span><input type="number" className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.sortOrder} onChange={(event) => setEditForm((current) => current ? { ...current, sortOrder: event.target.value } : current)} /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-[#21300f]">Estado</span><select className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24]" value={editForm.isActive ? "ACTIVE" : "INACTIVE"} onChange={(event) => setEditForm((current) => current ? { ...current, isActive: event.target.value === "ACTIVE" } : current)}><option value="ACTIVE">Activa</option><option value="INACTIVE">Inactiva</option></select></label>
          </form>
        ) : null}
      </AdminOverlayPanel>
    </section>
  );
}
