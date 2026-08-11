export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9f8d63]">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-[#2c341c] md:text-4xl">
          Panel principal del ERP
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#5b6645] md:text-base">
          Este contenido cambia por ruta, pero el sidebar permanece porque vive
          en el layout del grupo ERP. Esa es la base correcta para Kapos.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] bg-[#f6f1e5] p-5">
          <p className="text-sm text-[#7a6c4d]">Ordenes activas</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">128</strong>
        </article>
        <article className="rounded-[28px] bg-[#f3f7ec] p-5">
          <p className="text-sm text-[#99c050]">Rutas del dia</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">24</strong>
        </article>
        <article className="rounded-[28px] bg-[#fff7e8] p-5">
          <p className="text-sm text-[#8d7048]">Alertas pendientes</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">7</strong>
        </article>
      </div>
    </section>
  );
}
