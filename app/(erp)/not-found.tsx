import Link from "next/link";
import { Compass, SearchX } from "lucide-react";
import { AdminActionButton } from "../components/admin/AdminActionButton";

export default function ErpNotFound() {
  return (
    <section className="grid min-h-[calc(100vh-10rem)] place-items-center">
      <div className="w-full max-w-3xl rounded-[36px] border border-[#e7edd5] bg-[radial-gradient(circle_at_top,#ffffff_0%,#fffef9_58%,#f8fbef_100%)] p-8 text-center shadow-[0_24px_60px_rgba(17,17,17,0.08)] md:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#dfe8c5] bg-[#f7fbe8] text-[#8fbf18] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <SearchX className="h-9 w-9" strokeWidth={2.1} />
        </div>

        <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#91aa47]">
          Kapos ERP
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#18200f] md:text-5xl">
          Ups, submodulo no encontrado
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#5d664d] md:text-base">
          La ruta existe dentro del ERP, pero esa vista todavia no fue construida
          o el enlace ya no coincide con el catalogo actual de Kapos.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-[#e8eed9] bg-white/90 p-5 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e5ecd2] bg-[#f8fbe9] text-[#8bad2c]">
              <Compass className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#1b2111]">
              Que puede haber pasado
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#61704c]">
              Puede faltar el codigo de esa pantalla, la ruta puede haber cambiado,
              o el modulo fue creado en catalogo pero aun no tiene implementacion real.
            </p>
          </article>

          <article className="rounded-[28px] border border-[#e8eed9] bg-[linear-gradient(135deg,#fcffe9_0%,#f6fadf_100%)] p-5 text-left">
            <h2 className="text-lg font-semibold text-[#1b2111]">
              Que hacer ahora
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#61704c]">
              Vuelve al dashboard o regresa a un modulo existente desde el sidebar.
              Si eres superadmin, revisa que la ruta del submodulo coincida con una
              pagina real del frontend.
            </p>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard">
            <AdminActionButton tone="primary">Ir al dashboard</AdminActionButton>
          </Link>
          <Link href="/home">
            <AdminActionButton tone="secondary">Volver al inicio ERP</AdminActionButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
