export default function RrhhPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#00C70D]">
          RRHH
        </p>
        <h1 className="text-3xl font-semibold text-[#0D0D0D]">
          Modulo de recursos humanos
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#535353] md:text-base">
          Desde aqui puedes centralizar la gestion de personas, asistencia y
          documentos laborales.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] bg-[#F8F8F8] p-5">
          <p className="text-sm text-[#535353]">Colaboradores activos</p>
          <strong className="mt-3 block text-3xl text-[#0D0D0D]">214</strong>
        </article>
        <article className="rounded-[28px] bg-[#eef5e4] p-5">
          <p className="text-sm text-[#65754f]">Incidencias del dia</p>
          <strong className="mt-3 block text-3xl text-[#0D0D0D]">12</strong>
        </article>
        <article className="rounded-[28px] bg-[#F8F8F8] p-5">
          <p className="text-sm text-[#8c7147]">Boletas por aprobar</p>
          <strong className="mt-3 block text-3xl text-[#0D0D0D]">8</strong>
        </article>
      </div>
    </section>
  );
}
