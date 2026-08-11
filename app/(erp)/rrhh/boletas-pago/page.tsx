export default function BoletasPagoPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9f8d63]">
          RRHH
        </p>
        <h1 className="text-3xl font-semibold text-[#2c341c]">
          Boletas de pago
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#5b6645] md:text-base">
          Espacio para consolidar planillas, periodos y envio de boletas.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] bg-[#f3f7ec] p-6">
          <p className="text-sm text-[#687950]">Periodo activo</p>
          <strong className="mt-2 block text-3xl text-[#2c341c]">Jul 2026</strong>
        </article>
        <article className="rounded-[28px] bg-[#fff7e8] p-6">
          <p className="text-sm text-[#8c7147]">Boletas generadas</p>
          <strong className="mt-2 block text-3xl text-[#2c341c]">206</strong>
        </article>
      </div>
    </section>
  );
}
