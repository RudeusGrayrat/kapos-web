import { Bluetooth, MonitorSmartphone, Printer, ReceiptText, Settings2, Utensils } from "lucide-react";
import { AdminModuleHeader, PanelCard, Tag } from "../../../components/admin/AdminBlocks";

const printRoutes = [
  {
    name: "Ticket de venta",
    trigger: "Al cobrar",
    target: "Caja / POS",
    format: "80mm",
    status: "Piloto web",
  },
  {
    name: "Boleta o factura",
    trigger: "Al emitir comprobante",
    target: "Cliente",
    format: "PDF fiscal o ticket",
    status: "Depende del proveedor",
  },
  {
    name: "Precuenta",
    trigger: "Antes del pago",
    target: "Mesa",
    format: "80mm",
    status: "Pendiente",
  },
  {
    name: "Comanda",
    trigger: "Al enviar a cocina/bar",
    target: "Cocina / Barra",
    format: "58mm u 80mm",
    status: "Pendiente",
  },
];

const deviceModes = [
  {
    title: "Web en PC",
    description: "Usa la impresora instalada en Windows y el dialogo de impresion del navegador.",
    icon: Printer,
    recommendation: "Ideal para Basti si cobra desde caja con ticketera USB.",
  },
  {
    title: "Mobile Android",
    description: "Requiere modulo nativo para Bluetooth, red local o impresion del sistema Android.",
    icon: Bluetooth,
    recommendation: "Sirve para celulares propios, no necesariamente para Izipay.",
  },
  {
    title: "Izipay POS",
    description: "Debe integrarse con el SDK del equipo para pagos, impresora interna y permisos del terminal.",
    icon: MonitorSmartphone,
    recommendation: "No funciona en Expo Go; requiere APK/build nativa.",
  },
];

export default function ImpresionPage() {
  return (
    <section className="space-y-8">
      <AdminModuleHeader
        eyebrow="Configuracion"
        title="Dispositivos e impresion"
        description="Define como imprimira Kapos segun el punto de venta: PC, mobile Android, Izipay, cocina o barra."
        action={<Settings2 className="h-6 w-6 text-[#6d8a20]" />}
        stats={[
          { label: "Estado", value: "Base definida", hint: "Aun falta persistencia y drivers reales.", tone: "dark" },
          { label: "Primer piloto", value: "Web + ticketera", hint: "La ruta mas rapida para probar caja.", tone: "accent" },
          { label: "Izipay", value: "SDK requerido", hint: "No depende solo de React Native." },
        ]}
      />

      <PanelCard
        title="Rutas de impresion"
        description="Cada ruta responde a un evento del POS. La facturacion genera el documento; este modulo decide donde y como imprimirlo."
        action={<Tag tone="soft">Configuracion operativa</Tag>}
      >
        <div className="grid gap-3">
          {printRoutes.map((route) => (
            <article key={route.name} className="rounded-[22px] border border-[#e7edd9] bg-[#fbfcf7] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#1d2611]">{route.name}</h3>
                  <p className="mt-1 text-sm text-[#657052]">
                    {route.trigger} hacia {route.target}
                  </p>
                </div>
                <Tag tone={route.status === "Piloto web" ? "accent" : "soft"}>{route.status}</Tag>
              </div>
              <p className="mt-3 text-sm text-[#59634a]">Formato recomendado: {route.format}</p>
            </article>
          ))}
        </div>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {deviceModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <PanelCard key={mode.title} title={mode.title} description={mode.description}>
              <div className="flex h-full flex-col justify-between gap-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6dd] text-[#5e7d11]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="rounded-[18px] bg-[#f7f9ef] px-4 py-3 text-sm leading-6 text-[#59634a]">
                  {mode.recommendation}
                </p>
              </div>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard
        title="Decision para cobranza"
        description="Para pruebas, el POS solo necesita registrar el metodo de pago y la caja abierta. La cuenta destino se agrega cuando conciliemos Yape, Plin, bancos o pasarelas reales."
        action={<ReceiptText className="h-5 w-5 text-[#6d8a20]" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] bg-[#f6f8ef] p-5">
            <h3 className="font-semibold text-[#202914]">Ahora</h3>
            <p className="mt-2 text-sm leading-6 text-[#606b4e]">
              Efectivo, Yape, Plin, tarjeta y transferencia se registran como metodos de pago dentro de la caja.
            </p>
          </div>
          <div className="rounded-[22px] bg-[#fff8e8] p-5">
            <h3 className="font-semibold text-[#202914]">Luego</h3>
            <p className="mt-2 text-sm leading-6 text-[#606b4e]">
              Agregaremos cuentas receptoras para saber a que QR, banco, POS fisico o billetera llego cada cobro.
            </p>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Siguiente integracion real"
        description="Cuando confirmemos el hardware, este submodulo debe guardar impresoras, reglas y permisos por sucursal/caja."
        action={<Utensils className="h-5 w-5 text-[#6d8a20]" />}
      >
        <p className="text-sm leading-7 text-[#59634a]">
          Para Izipay necesitaremos el modelo exacto del equipo, documentacion del SDK, permisos de impresion/pagos y una build nativa. Para Web podemos empezar antes con una vista imprimible y ticketera instalada en Windows.
        </p>
      </PanelCard>
    </section>
  );
}
