"use client";

import { useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Building2,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  AdminActionButton,
  CheckIcon,
} from "../../components/admin/AdminActionButton";
import {
  AdminMessage,
  AdminModuleHeader,
  PanelCard,
  Tag,
} from "../../components/admin/AdminBlocks";
import {
  getProfileStatus,
  getUserDisplayName,
  getUserSummaryName,
  useAuth,
} from "../../context/auth-context";
import type { DocumentType, UpdateCurrentUserInput } from "../../types/auth";

const inputClass =
  "w-full rounded-[18px] border border-[var(--kapos-border)] bg-white px-4 py-3 text-sm text-[var(--kapos-text)] outline-none transition focus:border-[var(--kapos-green)]";

const documentTypes: Array<DocumentType | ""> = ["", "DNI", "RUC", "CE", "PASSPORT"];

function formatDate(value: string | null) {
  if (!value) return "Sin registro";
  return new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PerfilPage() {
  const {
    activeOrganization,
    effectivePermissionKeys,
    memberships,
    platformContext,
    reloadCurrentUser,
    setActiveOrganizationId,
    updateProfile,
    user,
  } = useAuth();
  const [form, setForm] = useState<Required<Pick<UpdateCurrentUserInput, "firstName" | "lastName" | "phone" | "documentType" | "documentNumber">>>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    documentType: user?.documentType ?? "",
    documentNumber: user?.documentNumber ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await updateProfile(form);
      await reloadCurrentUser();
      setMessage("Tus datos de perfil fueron actualizados.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo actualizar el perfil.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Perfil"
        title={getUserDisplayName(user)}
        description="Consulta tu identidad, organizacion activa, permisos y datos personales dentro de Kapos."
        stats={[
          {
            label: "Usuario",
            value: getUserSummaryName(user),
            hint: getProfileStatus(user),
            tone: "dark",
          },
          {
            label: "Organizacion",
            value: activeOrganization?.organizationName ?? "Sin organizacion",
            hint: activeOrganization
              ? "Contexto activo para el ERP."
              : "No hay una organizacion activa.",
            tone: "accent",
          },
          {
            label: "Permisos",
            value: String(effectivePermissionKeys.length),
            hint: platformContext ? "Incluye permisos de plataforma." : "Permisos de organizacion.",
          },
        ]}
      />

      {message ? (
        <AdminMessage title="Perfil guardado" description={message} tone="accent" />
      ) : null}
      {error ? (
        <AdminMessage title="No pudimos guardar" description={error} tone="warn" />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <PanelCard
          title="Datos personales"
          description="Estos datos identifican al usuario en accesos, reportes internos y trazabilidad operativa."
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--kapos-text)]">Nombres</span>
              <input
                className={inputClass}
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, firstName: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--kapos-text)]">Apellidos</span>
              <input
                className={inputClass}
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lastName: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--kapos-text)]">Tipo de documento</span>
              <select
                className={inputClass}
                value={form.documentType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    documentType: event.target.value as DocumentType | "",
                  }))
                }
              >
                {documentTypes.map((type) => (
                  <option key={type || "empty"} value={type}>
                    {type || "Sin documento"}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--kapos-text)]">Numero de documento</span>
              <input
                className={inputClass}
                value={form.documentNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, documentNumber: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--kapos-text)]">Correo</span>
              <div className="flex min-h-12 items-center gap-3 rounded-[18px] border border-[var(--kapos-border)] bg-[var(--kapos-card-alt)] px-4 text-sm text-[var(--kapos-text-soft)]">
                <Mail className="h-4 w-4 text-[var(--kapos-green)]" />
                {user?.email ?? "Sin correo"}
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--kapos-text)]">Telefono</span>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <AdminActionButton
                type="submit"
                tone="primary"
                icon={<CheckIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar perfil"}
              </AdminActionButton>
            </div>
          </form>
        </PanelCard>

        <div className="space-y-6">
          <PanelCard
            title="Resumen de acceso"
            description="Vista rapida de tu sesion y alcance actual."
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-[18px] border border-[var(--kapos-border)] bg-white p-4">
                <UserRound className="h-5 w-5 text-[var(--kapos-green)]" />
                <div>
                  <p className="font-semibold text-[var(--kapos-text)]">{user?.status ?? "Sin estado"}</p>
                  <p className="text-sm text-[var(--kapos-text-soft)]">Estado de usuario</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[18px] border border-[var(--kapos-border)] bg-white p-4">
                <BadgeCheck className="h-5 w-5 text-[var(--kapos-green)]" />
                <div>
                  <p className="font-semibold text-[var(--kapos-text)]">{formatDate(user?.lastLoginAt ?? null)}</p>
                  <p className="text-sm text-[var(--kapos-text-soft)]">Ultimo inicio de sesion</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[18px] border border-[var(--kapos-border)] bg-white p-4">
                <Sparkles className="h-5 w-5 text-[var(--kapos-green)]" />
                <div>
                  <p className="font-semibold text-[var(--kapos-text)]">Puntos no conectados</p>
                  <p className="text-sm text-[var(--kapos-text-soft)]">
                    El resumen de sesion aun no incluye billetera de fidelizacion.
                  </p>
                </div>
              </div>
            </div>
          </PanelCard>

          <PanelCard
            title="Seguridad"
            description="El cambio de contrasena queda reservado para cuando el backend exponga el endpoint."
          >
            <div className="rounded-[18px] border border-dashed border-[var(--kapos-border)] bg-[var(--kapos-card-alt)] p-4">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-[var(--kapos-green)]" />
                <p className="font-semibold text-[var(--kapos-text)]">Cambio de contrasena pendiente</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--kapos-text-soft)]">
                La pantalla ya tiene el lugar definido; falta agregar la ruta segura en API para validar contrasena actual y guardar una nueva.
              </p>
            </div>
          </PanelCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PanelCard
          title="Organizaciones"
          description="Selecciona el contexto en el que trabajas dentro del ERP."
        >
          <div className="space-y-3">
            {memberships.length === 0 ? (
              <AdminMessage
                title="Sin organizaciones"
                description="Tu usuario no tiene memberships activos asignados."
                tone="warn"
              />
            ) : null}
            {memberships.map((membership) => {
              const isActive =
                membership.organizationId === activeOrganization?.organizationId;

              return (
                <button
                  key={membership.membershipId}
                  type="button"
                  onClick={() => setActiveOrganizationId(membership.organizationId)}
                  className={`w-full rounded-[18px] border p-4 text-left transition ${
                    isActive
                      ? "border-[var(--kapos-green)] bg-[var(--kapos-green-wash)]"
                      : "border-[var(--kapos-border)] bg-white hover:border-[color-mix(in_srgb,var(--kapos-green)_24%,white)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-1 h-5 w-5 text-[var(--kapos-green)]" />
                      <div>
                        <p className="font-semibold text-[var(--kapos-text)]">
                          {membership.organizationName}
                        </p>
                        <p className="mt-1 text-xs text-[var(--kapos-text-soft)]">
                          /{membership.organizationSlug}
                        </p>
                      </div>
                    </div>
                    <Tag tone={isActive ? "accent" : "soft"}>
                      {isActive ? "Activa" : membership.membershipStatus}
                    </Tag>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {membership.roleKeys.map((role) => (
                      <Tag key={role}>{role}</Tag>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </PanelCard>

        <PanelCard
          title="Permisos"
          description="Permisos efectivos cargados para la sesion actual."
        >
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-[var(--kapos-border)] bg-white p-4">
              <ShieldCheck className="h-5 w-5 text-[var(--kapos-green)]" />
              <p className="mt-3 text-2xl font-semibold text-[var(--kapos-text)]">
                {effectivePermissionKeys.length}
              </p>
              <p className="text-sm text-[var(--kapos-text-soft)]">Permisos efectivos</p>
            </div>
            <div className="rounded-[18px] border border-[var(--kapos-border)] bg-white p-4">
              <Building2 className="h-5 w-5 text-[var(--kapos-green)]" />
              <p className="mt-3 text-2xl font-semibold text-[var(--kapos-text)]">
                {activeOrganization?.moduleKeys.length ?? 0}
              </p>
              <p className="text-sm text-[var(--kapos-text-soft)]">Modulos activos</p>
            </div>
            <div className="rounded-[18px] border border-[var(--kapos-border)] bg-white p-4">
              <Phone className="h-5 w-5 text-[var(--kapos-green)]" />
              <p className="mt-3 text-2xl font-semibold text-[var(--kapos-text)]">
                {activeOrganization?.branchIds.length ?? 0}
              </p>
              <p className="text-sm text-[var(--kapos-text-soft)]">Sucursales</p>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto rounded-[18px] border border-[var(--kapos-border)] bg-white p-3">
            {effectivePermissionKeys.length === 0 ? (
              <p className="p-3 text-sm text-[var(--kapos-text-soft)]">
                No hay permisos cargados para esta sesion.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {effectivePermissionKeys.map((permission) => (
                <Tag key={permission}>{permission}</Tag>
              ))}
            </div>
          </div>
        </PanelCard>
      </div>
    </section>
  );
}
