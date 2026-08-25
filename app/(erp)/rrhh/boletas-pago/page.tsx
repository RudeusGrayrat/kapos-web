export default function BoletasPagoPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#00C70D]">
          RRHH
        </p>
        <h1 className="text-3xl font-semibold text-[#0D0D0D]">
          Boletas de pago
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#535353] md:text-base">
          Espacio para consolidar planillas, periodos y envio de boletas.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] bg-[#E8FCEB] p-6">
          <p className="text-sm text-[#687950]">Periodo activo</p>
          <strong className="mt-2 block text-3xl text-[#0D0D0D]">Jul 2026</strong>
        </article>
        <article className="rounded-[28px] bg-[#F8F8F8] p-6">
          <p className="text-sm text-[#8c7147]">Boletas generadas</p>
          <strong className="mt-2 block text-3xl text-[#0D0D0D]">206</strong>
        </article>
      </div>
    </section>
  );
}
