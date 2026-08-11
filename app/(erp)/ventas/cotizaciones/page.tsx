export default function VentasCotizacionesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9f8d63]">
          Ventas
        </p>
        <h1 className="text-3xl font-semibold text-[#2c341c]">
          Cotizaciones
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#5b6645] md:text-base">
          Vista temporal para ofertas, escenarios comerciales y aprobaciones.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] bg-[#f6f1e5] p-6">
          <p className="text-sm text-[#7a6c4d]">Cotizaciones activas</p>
          <strong className="mt-2 block text-3xl text-[#2c341c]">14</strong>
        </article>
        <article className="rounded-[28px] bg-[#eef5e4] p-6">
          <p className="text-sm text-[#65754f]">Pendientes de respuesta</p>
          <strong className="mt-2 block text-3xl text-[#2c341c]">6</strong>
        </article>
      </div>
    </section>
  );
}
