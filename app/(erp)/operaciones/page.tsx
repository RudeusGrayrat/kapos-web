export default function OperacionesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9f8d63]">
          Operaciones
        </p>
        <h1 className="text-3xl font-semibold text-[#2c341c]">
          Control operativo y despacho
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#5b6645] md:text-base">
          Vista para consolidar rutas, manifiestos y coordinacion diaria.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] bg-[#f6f1e5] p-5">
          <p className="text-sm text-[#7a6c4d]">Salidas programadas</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">31</strong>
        </article>
        <article className="rounded-[28px] bg-[#eef5e4] p-5">
          <p className="text-sm text-[#65754f]">Unidades en ruta</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">42</strong>
        </article>
        <article className="rounded-[28px] bg-[#fff7e8] p-5">
          <p className="text-sm text-[#8c7147]">Incidencias abiertas</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">5</strong>
        </article>
      </div>
    </section>
  );
}
