import Link from "next/link";
import { Blocks, Compass, Hammer } from "lucide-react";
import { AdminActionButton } from "./AdminActionButton";

type UnbuiltModuleNoticeProps = {
  path?: string;
};

function prettifyPath(path?: string) {
  if (!path) return "Submodulo pendiente";

  const segments = path
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) return "Submodulo pendiente";

  return segments
    .map((segment) =>
      segment
        .split("-")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    )
    .join(" / ");
}

export function UnbuiltModuleNotice({ path }: UnbuiltModuleNoticeProps) {
  return (
    <section className="grid min-h-[calc(100vh-10rem)] place-items-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-[34px] border border-[var(--kapos-border)] bg-[radial-gradient(circle_at_top,var(--kapos-card)_0%,var(--kapos-lime-wash)_58%,var(--kapos-card-alt)_100%)] shadow-[0_24px_60px_rgba(12,13,15,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-72 flex-col justify-between bg-[var(--kapos-black)] p-8 text-white md:p-10">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[var(--kapos-lime)]">
                <Hammer className="h-7 w-7" strokeWidth={2.1} />
              </div>
              <p className="mt-7 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[var(--kapos-lime)]">
                Kapos ERP
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                Vista en construccion
              </h1>
            </div>
            <p className="mt-8 text-sm leading-7 text-white/70">
              El submodulo ya puede vivir en el menu y permisos, pero todavia no
              tiene una pantalla funcional publicada.
            </p>
          </div>

          <div className="p-8 md:p-10">
            <div className="rounded-[26px] border border-[var(--kapos-border)] bg-white/90 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--kapos-border-strong)] bg-[var(--kapos-lime-wash)] text-[var(--kapos-success)]">
                  <Blocks className="h-6 w-6" strokeWidth={2.1} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--kapos-success)]">
                    Ruta solicitada
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--kapos-text)]">
                    {prettifyPath(path)}
                  </h2>
                  {path ? (
                    <p className="mt-2 break-all rounded-2xl bg-[var(--kapos-card-alt)] px-3 py-2 text-xs font-medium text-[var(--kapos-text-soft)]">
                      {path}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-[var(--kapos-border)] bg-[var(--kapos-card-alt)] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--kapos-border)] bg-white text-[var(--kapos-success)]">
                  <Compass className="h-6 w-6" strokeWidth={2.1} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--kapos-text)]">
                    Puedes seguir trabajando
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--kapos-text-soft)]">
                    Esto no es una caida del ERP. El sidebar, la sesion y el
                    contexto de organizacion siguen activos para moverte a una
                    vista ya terminada.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard">
                <AdminActionButton tone="primary">Ir al dashboard</AdminActionButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
