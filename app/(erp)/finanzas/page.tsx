export default function FinanzasPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9f8d63]">
          Finanzas
        </p>
        <h1 className="text-3xl font-semibold text-[#2c341c]">
          Control financiero
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#5b6645] md:text-base">
          Modulo para seguir facturacion, tesoreria y reportes economicos.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] bg-[#f6f1e5] p-5">
          <p className="text-sm text-[#7a6c4d]">Cobranza del mes</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">S/ 182k</strong>
        </article>
        <article className="rounded-[28px] bg-[#eef5e4] p-5">
          <p className="text-sm text-[#65754f]">Pagos programados</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">19</strong>
        </article>
        <article className="rounded-[28px] bg-[#fff7e8] p-5">
          <p className="text-sm text-[#8c7147]">Alertas contables</p>
          <strong className="mt-3 block text-3xl text-[#2c341c]">3</strong>
        </article>
      </div>
    </section>
  );
}
