export default function VentasCotizacionesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#00C70D]">
          Ventas
        </p>
        <h1 className="text-3xl font-semibold text-[#0D0D0D]">
          Cotizaciones
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#535353] md:text-base">
          Vista temporal para ofertas, escenarios comerciales y aprobaciones.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] bg-[#F8F8F8] p-6">
          <p className="text-sm text-[#535353]">Cotizaciones activas</p>
          <strong className="mt-2 block text-3xl text-[#0D0D0D]">14</strong>
        </article>
        <article className="rounded-[28px] bg-[#eef5e4] p-6">
          <p className="text-sm text-[#65754f]">Pendientes de respuesta</p>
          <strong className="mt-2 block text-3xl text-[#0D0D0D]">6</strong>
        </article>
      </div>
    </section>
  );
}
