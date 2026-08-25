export default function TransportistasPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#00C70D]">
          Transportistas
        </p>
        <h1 className="text-3xl font-semibold text-[#0D0D0D]">
          Control operativo de flota y terceros
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[#535353] md:text-base">
          Esta ruta queda lista para tu modulo de transportistas, con el mismo
          shell persistente del ERP.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] bg-[#f4efe3] p-6">
          <p className="text-sm text-[#78684a]">Disponibles</p>
          <strong className="mt-2 block text-3xl text-[#0D0D0D]">18</strong>
        </article>
        <article className="rounded-[28px] bg-[#eef5e4] p-6">
          <p className="text-sm text-[#667650]">En ruta</p>
          <strong className="mt-2 block text-3xl text-[#0D0D0D]">42</strong>
        </article>
      </div>
    </section>
  );
}
