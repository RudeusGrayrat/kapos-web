import Link from "next/link";
import { ArrowRight, Banknote, FileText, Landmark, PlugZap, ReceiptText, WalletCards } from "lucide-react";
import { AdminModuleHeader, PanelCard, Tag } from "../../components/admin/AdminBlocks";

const financeSections = [
  {
    title: "Facturacion",
    description: "Bandeja de comprobantes, emision, reintentos y acceso al PDF fiscal.",
    href: "/finanzas/facturacion",
    status: "Operativo",
    icon: FileText,
  },
  {
    title: "Series fiscales",
    description: "Series y correlativos por sucursal para boletas y facturas.",
    href: "/finanzas/series-fiscales",
    status: "Operativo",
    icon: ReceiptText,
  },
  {
    title: "Proveedores fiscales",
    description: "Conexion fiscal configurable para Nubefact/PSE u otro proveedor futuro.",
    href: "/finanzas/proveedores-fiscales",
    status: "Operativo",
    icon: PlugZap,
  },
  {
    title: "Cuentas por cobrar",
    description: "Saldos pendientes, credito a clientes y seguimiento de pagos.",
    href: "/finanzas/cuentas-por-cobrar",
    status: "Por construir",
    icon: WalletCards,
  },
  {
    title: "Gastos",
    description: "Registro y clasificacion de gastos operativos del negocio.",
    href: "/finanzas/gastos",
    status: "Por construir",
    icon: Banknote,
  },
  {
    title: "Bancos y conciliacion",
    description: "Movimientos bancarios, conciliaciones y control de cuentas.",
    href: "/finanzas/bancos-conciliacion",
    status: "Por construir",
    icon: Landmark,
  },
];

export default function FinanzasPage() {
  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Finanzas"
        title="Control financiero"
        description="Finanzas agrupa facturacion electronica y, luego, las piezas contables que creceran alrededor del POS."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {financeSections.map((section) => {
          const Icon = section.icon;
          const isReady = section.status === "Operativo";
          return (
            <Link key={section.href} href={section.href} className="group block">
              <PanelCard
                title={section.title}
                description={section.description}
                action={<Tag tone={isReady ? "accent" : "soft"}>{section.status}</Tag>}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6dd] text-[#5e7d11]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f7d16] transition group-hover:translate-x-1">
                    Abrir
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </PanelCard>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
