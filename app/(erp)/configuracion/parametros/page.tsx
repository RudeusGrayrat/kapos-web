import { Settings2, SlidersHorizontal } from "lucide-react";
import { AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";

const plannedSettings = [
  "Moneda y redondeo",
  "Reglas de IGV",
  "Puntos y fidelizacion",
  "Formatos de ticket",
  "Preferencias operativas",
];

export default function ConfigParametrosPage() {
  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Configuracion"
        title="Parametros generales"
        description="Espacio reservado para reglas globales del negocio. Los metodos de pago ahora tienen su propio submodulo."
        action={<SlidersHorizontal className="h-6 w-6 text-[#00C70D]" />}
        stats={[
          { label: "Estado", value: "Ordenado", hint: "Sin formularios mezclados.", tone: "dark" },
          { label: "Pagos", value: "Separados", hint: "Gestion en Metodos de pago.", tone: "accent" },
          { label: "Uso", value: "Futuro", hint: "Parametros transversales del ERP." },
        ]}
      />

      <PanelCard
        title="Aun no hay parametros generales construidos"
        description="Cuando definamos reglas transversales, entraran aqui sin contaminar submodulos operativos."
        action={<Tag tone="soft">Por construir</Tag>}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {plannedSettings.map((setting) => (
            <div key={setting} className="flex items-center gap-3 rounded-[20px] border border-[#e7edd9] bg-[#F8F8F8] px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#eef6dd] text-[#5e7d11]">
                <Settings2 className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-[#28341a]">{setting}</p>
            </div>
          ))}
        </div>
      </PanelCard>
    </section>
  );
}
