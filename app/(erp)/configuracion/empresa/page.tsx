"use client";

import { useEffect, useState } from "react";
import { AdminActionButton, PlusIcon } from "../../../components/admin/AdminActionButton";
import { AdminMessage, AdminModuleHeader, PanelCard } from "../../../components/admin/AdminBlocks";
import { AdminImageField } from "../../../components/admin/AdminImageField";
import { useAuth } from "../../../context/auth-context";
import { useToast } from "../../../context/toast-context";
import { getOrganizationProfile, updateOrganizationProfile, uploadOrganizationLogo } from "../../../lib/erp-api";
import { isApiError, resolveApiAssetUrl } from "../../../lib/api";
import type { OrganizationProfile } from "../../../types/erp";

const currencyOptions = [
  { value: "PEN", label: "Soles peruanos (PEN)" },
  { value: "USD", label: "Dólares americanos (USD)" },
  { value: "EUR", label: "Euros (EUR)" },
];

const timezoneOptions = [
  { value: "America/Lima", label: "Perú - Lima (America/Lima)" },
  { value: "America/Bogota", label: "Colombia - Bogotá (America/Bogota)" },
  { value: "America/Santiago", label: "Chile - Santiago (America/Santiago)" },
  { value: "America/Mexico_City", label: "México - CDMX (America/Mexico_City)" },
  { value: "America/New_York", label: "EE.UU. Este (America/New_York)" },
];

export default function ConfigEmpresaPage() {
  const { accessToken, activeOrganizationId, refreshSession, reloadCurrentUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [form, setForm] = useState({
    legalName: "",
    tradeName: "",
    documentNumber: "",
    email: "",
    phone: "",
    currencyCode: "PEN",
    timezone: "America/Lima",
    taxRate: "18",
    receiptFooter: "",
    logoUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveToken() {
    return accessToken ?? (await refreshSession({ silent: true }))?.accessToken ?? null;
  }

  async function loadProfile() {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    const data = await getOrganizationProfile({ accessToken: token, organizationId: activeOrganizationId });
    setProfile(data);
    setForm({
      legalName: data.legalName,
      tradeName: data.tradeName ?? "",
      documentNumber: data.documentNumber ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      currencyCode: data.settings.currencyCode,
      timezone: data.settings.timezone,
      taxRate: String(data.settings.taxRate),
      receiptFooter: data.settings.receiptFooter ?? "",
      logoUrl: data.settings.logoUrl ?? "",
    });
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadProfile();
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la empresa.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, activeOrganizationId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await resolveToken();
    if (!token || !activeOrganizationId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateOrganizationProfile({
        accessToken: token,
        organizationId: activeOrganizationId,
        body: {
          ...form,
          taxRate: Number(form.taxRate || "0"),
        },
      });
      await loadProfile();
      await reloadCurrentUser();
      toast.showSuccess("Datos de empresa actualizados correctamente.", "Empresa actualizada");
    } catch (submitError) {
      const message = isApiError(submitError) ? submitError.messages.join(" ") : submitError instanceof Error ? submitError.message : "No se pudo actualizar la empresa.";
      setError(message);
      toast.showError(message, "No pudimos guardar");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function uploadLogo(file: File) {
    const token = await resolveToken();
    if (!token || !activeOrganizationId) {
      throw new Error("No hay organizacion activa.");
    }

    const asset = await uploadOrganizationLogo({
      accessToken: token,
      organizationId: activeOrganizationId,
      file,
    });

    toast.showSuccess("Logo subido a la carpeta de la empresa.", "Logo listo");
    return {
      value: asset.url,
      detail: `Logo guardado como ${asset.path}. Guarda empresa para confirmar el cambio.`,
    };
  }

  if (!activeOrganizationId) {
    return <AdminMessage title="Sin organizacion activa" description="Selecciona o asigna una organizacion antes de configurar empresa." tone="warn" />;
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Configuracion"
        title="Datos de empresa"
        description="Identidad fiscal y preferencias base de la organizacion activa."
        stats={[
          { label: "Organizacion", value: profile?.tradeName ?? profile?.legalName ?? "...", hint: "Cliente activo de Kapos.", tone: "dark" },
          { label: "Moneda", value: form.currencyCode, hint: "Base para precios, caja y comprobantes.", tone: "accent" },
          { label: "IGV", value: `${form.taxRate || "0"}%`, hint: "Tasa tributaria por defecto." },
        ]}
      />

      {error ? <AdminMessage title="No pudimos guardar" description={error} tone="warn" /> : null}

      <PanelCard title="Perfil operativo" description={isLoading ? "Cargando datos reales..." : "Estos datos alimentaran tickets, facturacion, pedidos y reportes."}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {[
            ["legalName", "Razon social", "BASTI FOODS S.A.C."],
            ["tradeName", "Nombre comercial", "Basti"],
            ["documentNumber", "RUC", "20601234567"],
            ["email", "Correo", "contacto@basti.com"],
            ["phone", "Telefono", "+51 999 888 777"],
            ["taxRate", "IGV %", "18"],
            ["receiptFooter", "Pie de ticket", "Gracias por tu compra."],
          ].map(([key, label, placeholder]) => (
            <label key={key} className="space-y-2">
              <span className="text-sm font-semibold text-[#0D0D0D]">{label}</span>
              <input
                className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0D0D0D]">Moneda</span>
            <select
              className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
              value={form.currencyCode}
              onChange={(event) => setForm((current) => ({ ...current, currencyCode: event.target.value }))}
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0D0D0D]">Zona horaria</span>
            <select
              className="w-full rounded-[20px] border border-[#E4E4E4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00C70D]"
              value={form.timezone}
              onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
            >
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <AdminImageField
              label="Logo de empresa"
              value={form.logoUrl}
              previewSrc={resolveApiAssetUrl(form.logoUrl)}
              description="Se usa como identidad visual de la organizacion en el ERP y queda preparado para tickets, comprobantes, reportes y documentos internos."
              maxBytes={5 * 1024 * 1024}
              maxWidth={1200}
              maxHeight={600}
              onUpload={uploadLogo}
              onChange={(logoUrl) => {
                setForm((current) => ({ ...current, logoUrl }));
                setError(null);
              }}
              onError={(message) => {
                setError(message);
                toast.showError(message, "Logo no valido");
              }}
              onInfo={(message) => toast.showInfo(message, "Logo preparado")}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <AdminActionButton type="submit" disabled={isSubmitting} tone="primary" icon={<PlusIcon />}>
              {isSubmitting ? "Guardando..." : "Guardar empresa"}
            </AdminActionButton>
          </div>
        </form>
      </PanelCard>
    </section>
  );
}
