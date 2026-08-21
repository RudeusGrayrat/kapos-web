import Image from "next/image";

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <header className="overflow-hidden rounded-[34px] border border-[#e7ecd6] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbd9_48%,#eef8bf_100%)] p-7 shadow-[0_18px_45px_rgba(32,36,21,0.06)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6d8a20]">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold text-[#2c341c] md:text-4xl">
              Dashboard operativo
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#5b6645] md:text-base">
              Este contenido cambia por ruta, pero el sidebar permanece porque vive
              en el layout del grupo ERP. Esa es la base correcta para Kapos.
            </p>
          </div>
          <div className="rounded-[28px] bg-white/80 px-6 py-5 shadow-[0_18px_35px_rgba(12,13,15,0.08)]">
            <Image
              src="/brand/kapos-logo.svg"
              alt="Kapos"
              width={260}
              height={94}
              className="h-auto w-52 md:w-64"
              priority
            />
          </div>
        </div>
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
