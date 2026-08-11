"use client";

import Link from "next/link";
import { useAuth } from "./context/auth-context";

const PUBLIC_NAV = [
  { label: "Sobre nosotros", href: "#sobre-nosotros" },
  { label: "Modulos", href: "#modulos" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Contacto", href: "#contacto" },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef6e6_0%,#fbf7ed_42%,#f4ecd9_100%)] text-[#273119]">
      <header className="sticky top-0 z-20 border-b border-white/40 bg-[#fbf7ed]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2f3c1d] text-sm font-black text-white shadow-[0_12px_30px_rgba(47,60,29,0.24)]">
              K
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#7f714c]">
                Kapos
              </p>
              <p className="text-xs text-[#6f7c53]">ERP logistica y operacion</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 lg:flex">
            {PUBLIC_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#53623b] transition hover:text-[#2f3c1d]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-[#d8ccb0] px-4 py-2 text-sm font-semibold text-[#364327] transition hover:border-[#2f3c1d] hover:text-[#2f3c1d]"
            >
              Iniciar sesion
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="rounded-full bg-[#2f3c1d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(47,60,29,0.25)] transition hover:bg-[#243016]"
            >
              {isLoading ? "Cargando..." : isAuthenticated ? "Ir al ERP" : "Solicitar demo"}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-90px)] w-full max-w-[1300px] items-center gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="inline-flex rounded-full border border-[#ddd1b8] bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8f7d56]">
            Plataforma ERP
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] text-[#243016] md:text-6xl">
            Controla operaciones, personas y finanzas desde un mismo flujo.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#566445] md:text-lg">
            Kapos nace para centralizar tu operacion diaria sin perder claridad
            visual. La parte publica convence, y una vez inicias sesion entras a
            un ERP protegido donde el sidebar siempre permanece como casco
            estructural del sistema.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="rounded-full bg-[#2f3c1d] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,60,29,0.24)] transition hover:bg-[#243016]"
            >
              {isAuthenticated ? "Entrar al dashboard" : "Comenzar ahora"}
            </Link>
            <a
              href="#modulos"
              className="rounded-full border border-[#d7caaf] bg-white/80 px-7 py-3.5 text-sm font-semibold text-[#334224] transition hover:border-[#2f3c1d]"
            >
              Ver modulos
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-[#f2d58d]/50 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-[#bccf94]/50 blur-3xl" />
          <div className="relative overflow-hidden rounded-[42px] border border-[#eadfca] bg-[linear-gradient(160deg,#2f3c1d_0%,#44572b_100%)] p-6 text-white shadow-[0_30px_70px_rgba(38,48,22,0.28)]">
            <div className="rounded-[30px] bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                Shell ERP
              </p>
              <div className="mt-5 grid grid-cols-[84px_1fr] gap-4">
                <div className="rounded-[24px] bg-white/10 p-3">
                  <div className="space-y-3">
                    <div className="h-12 rounded-2xl bg-white" />
                    <div className="h-12 rounded-2xl bg-white/15" />
                    <div className="h-12 rounded-2xl bg-white/15" />
                    <div className="h-12 rounded-2xl bg-white/15" />
                  </div>
                </div>
                <div className="rounded-[24px] bg-[#f7f1e5] p-4 text-[#273119]">
                  <div className="rounded-[22px] bg-white p-4 shadow-[0_14px_30px_rgba(66,49,14,0.1)]">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#9f8d63]">
                      Modulo activo
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold">RRHH</h2>
                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl bg-[#fbf7ed] p-3">
                        <p className="text-sm font-semibold">Colaboradores</p>
                      </div>
                      <div className="rounded-2xl bg-[#2f3c1d] p-3 text-white">
                        <p className="text-sm font-semibold">Boletas de pago</p>
                      </div>
                      <div className="rounded-2xl bg-[#fbf7ed] p-3">
                        <p className="text-sm font-semibold">Asistencia</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="sobre-nosotros"
        className="mx-auto grid w-full max-w-[1300px] gap-6 px-6 py-12 md:grid-cols-3"
      >
        <article className="rounded-[30px] border border-[#eadfca] bg-white/80 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a8860]">
            Sobre nosotros
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-[#273119]">
            ERP pensado para operar y crecer.
          </h2>
        </article>
        <article className="rounded-[30px] border border-[#eadfca] bg-white/60 p-6 text-[#5d6846]">
          Kapos separa claramente la experiencia comercial del landing y la
          experiencia transaccional del ERP, para que ambas respiren bien.
        </article>
        <article className="rounded-[30px] border border-[#eadfca] bg-white/60 p-6 text-[#5d6846]">
          Una vez autenticado, el usuario entra a un shell protegido donde la
          navegacion principal siempre vive en el sidebar.
        </article>
      </section>

      <section id="modulos" className="mx-auto w-full max-w-[1300px] px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a8860]">
            Modulos
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[#273119]">
            Un sidebar compacto para modulos, y un panel lateral para
            submodulos.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["RRHH", "Colaboradores, boletas, asistencia y legajos."],
            ["Operaciones", "Manifiestos, transportistas y rutas."],
            ["Finanzas", "Facturacion, tesoreria y reportes."],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-[30px] border border-[#eadfca] bg-white/75 p-6 shadow-[0_14px_30px_rgba(66,49,14,0.06)]"
            >
              <h3 className="text-xl font-semibold text-[#273119]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#5b6645]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="beneficios"
        className="mx-auto grid w-full max-w-[1300px] gap-5 px-6 py-12 md:grid-cols-3"
      >
        {[
          "Sidebar persistente para no perder contexto.",
          "Rutas protegidas antes de entrar al shell ERP.",
          "Landing independiente para ventas, marca y onboarding.",
        ].map((item) => (
          <div
            key={item}
            className="rounded-[28px] bg-[#2f3c1d] p-6 text-white shadow-[0_18px_45px_rgba(47,60,29,0.18)]"
          >
            <p className="text-base leading-7">{item}</p>
          </div>
        ))}
      </section>

      <footer
        id="contacto"
        className="mx-auto flex w-full max-w-[1300px] flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a8860]">
            Contacto
          </p>
          <p className="mt-3 text-sm text-[#5b6645]">
            Landing publico y ERP privado, cada uno con su propia navegacion.
          </p>
        </div>
        <Link
          href={isAuthenticated ? "/dashboard" : "/login"}
          className="inline-flex rounded-full bg-[#2f3c1d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#243016]"
        >
          {isAuthenticated ? "Volver al ERP" : "Entrar a Kapos"}
        </Link>
      </footer>
    </main>
  );
}
