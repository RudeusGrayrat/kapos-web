"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  CheckCircle2,
  Cloud,
  Mail,
  MapPin,
  Package,
  Phone,
  Play,
  Puzzle,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UsersRound,
  Zap,
} from "lucide-react";
import { useAuth } from "./context/auth-context";

const PUBLIC_NAV = [
  { label: "Funciones", href: "#funciones" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

const FEATURES = [
  {
    title: "POS inteligente",
    description: "Ventas rapidas y sin errores. Funciona online y offline.",
    icon: ShoppingBag,
  },
  {
    title: "Inventario",
    description: "Control exacto de stock, recetas, insumos y mermas.",
    icon: Package,
  },
  {
    title: "Clientes y puntos",
    description: "Fideliza con puntos, promociones e historial de compra.",
    icon: UsersRound,
  },
  {
    title: "Reportes en tiempo real",
    description: "Decisiones basadas en datos, siempre al dia.",
    icon: BarChart3,
  },
];

const BENEFITS = [
  { label: "Ventas mas rapidas", value: "+35%", detail: "en promedio", icon: Zap },
  { label: "Control total", value: "100%", detail: "de tu operacion", icon: ShieldCheck },
  { label: "Multi-sede", value: "Expande", detail: "sin limites", icon: Store },
  { label: "Integraciones", value: "Conecta", detail: "tus herramientas", icon: Puzzle },
];

const MODULES = [
  ["Ventas (POS)", "Cobros agiles, multiples medios de pago y propinas.", ShoppingBag],
  ["Inventario", "Lotes, fechas de vencimiento, recetas y alertas.", Package],
  ["Clientes", "Historial de compras y segmentacion.", UsersRound],
  ["Fidelizacion", "Puntos, niveles y promociones personalizadas.", BadgePercent],
  ["Delivery", "Gestion de pedidos y control de repartidores.", Truck],
  ["Reportes", "Dashboards claros y KPIs en tiempo real.", BarChart3],
  ["Configuracion", "Catalogos, usuarios y permisos.", Settings],
  ["Nube segura", "Accede desde cualquier lugar y dispositivo.", Cloud],
] as const;

function ErpPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[650px]">
      <div className="rounded-t-[26px] border-[10px] border-[#0D0D0D] bg-white shadow-[0_38px_80px_rgba(13,13,13,0.22)]">
        <div className="flex min-h-[360px] overflow-hidden rounded-t-[14px] bg-[#F8F8F8]">
          <aside className="hidden w-24 border-r border-[#E4E4E4] bg-white p-4 sm:block">
            <Image
              src="/brand/kapos-k.svg"
              alt="Kapos"
              width={32}
              height={36}
              className="h-8 w-8 object-contain"
            />
            <div className="mt-7 space-y-3">
              {["Resumen", "Ventas", "Inventario", "Clientes", "Delivery"].map((item, index) => (
                <div
                  key={item}
                  className={`h-8 rounded-full ${index === 0 ? "bg-[#E8FCEB]" : "bg-[#F1F1F1]"}`}
                />
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#00C70D]">Kapos</p>
                <h2 className="mt-4 text-xl font-black text-[#0D0D0D]">Resumen general</h2>
              </div>
              <div className="h-9 w-32 rounded-full border border-[#E4E4E4] bg-white" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                ["Ventas del dia", "S/ 780.00", "+12.5%"],
                ["Pedidos", "356", "+5.1%"],
                ["Ticket promedio", "S/ 50.00", "+6.2%"],
                ["Clientes nuevos", "42", "+15.1%"],
              ].map(([label, value, trend]) => (
                <article key={label} className="rounded-[8px] bg-white p-4 shadow-[0_12px_28px_rgba(13,13,13,0.06)]">
                  <p className="text-[0.65rem] font-semibold text-[#535353]">{label}</p>
                  <strong className="mt-2 block text-sm font-black text-[#0D0D0D]">{value}</strong>
                  <span className="mt-1 block text-[0.65rem] font-bold text-[#00C70D]">{trend} vs ayer</span>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-[8px] bg-white p-5 shadow-[0_12px_28px_rgba(13,13,13,0.06)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-black text-[#0D0D0D]">Ventas ultimos 7 dias</p>
                  <span className="h-2 w-2 rounded-full bg-[#00C70D]" />
                </div>
                <div className="relative h-36">
                  <div className="absolute inset-0 rounded-xl bg-[linear-gradient(180deg,rgba(0,199,13,0.12)_0%,rgba(0,199,13,0)_100%)]" />
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 140" role="img" aria-label="Grafico de ventas">
                    <polyline
                      fill="none"
                      points="12,102 58,76 102,94 146,50 194,72 246,22 306,44"
                      stroke="#00C70D"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="5"
                    />
                    {[12, 58, 102, 146, 194, 246, 306].map((cx, index) => (
                      <circle key={cx} cx={cx} cy={[102, 76, 94, 50, 72, 22, 44][index]} fill="#00C70D" r="4" />
                    ))}
                  </svg>
                </div>
              </div>
              <div className="rounded-[8px] bg-white p-5 shadow-[0_12px_28px_rgba(13,13,13,0.06)]">
                <p className="text-xs font-black text-[#0D0D0D]">Ventas por canal</p>
                <div className="mt-5 grid place-items-center">
                  <div className="h-24 w-24 rounded-full bg-[conic-gradient(#00C70D_0_48%,#A1A1A1_48%_76%,#E4E4E4_76%_100%)] p-5">
                    <div className="h-full w-full rounded-full bg-white" />
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-xs text-[#535353]">
                  <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#00C70D]" />Tienda 60%</p>
                  <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#A1A1A1]" />Delivery 25%</p>
                  <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#E4E4E4]" />Pickup 15%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-5 w-[92%] rounded-b-[28px] bg-[linear-gradient(180deg,#535353_0%,#0D0D0D_100%)] shadow-[0_18px_30px_rgba(13,13,13,0.22)]" />
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const erpHref = isAuthenticated ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen bg-white text-[#0D0D0D]">
      <header className="sticky top-0 z-30 border-b border-[#E4E4E4] bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] w-full max-w-[1320px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Kapos">
            <Image
              src="/brand/kapos-logo.svg"
              alt="Kapos"
              width={166}
              height={60}
              className="h-auto w-32 sm:w-36"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-10 lg:flex">
            {PUBLIC_NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-bold text-[#0D0D0D] transition hover:text-[#00C70D]">
                {item.label}
              </a>
            ))}
          </nav>

          <Link
            href={erpHref}
            className="inline-flex min-h-11 items-center gap-3 rounded-[10px] bg-[#00C70D] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,199,13,0.25)] transition hover:bg-[#00920A]"
          >
            <ArrowRight className="h-4 w-4" />
            {isLoading ? "Cargando" : "Ir al ERP"}
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-28 hidden grid-cols-6 gap-4 opacity-80 lg:grid">
          {Array.from({ length: 36 }).map((_, index) => (
            <span key={index} className="h-1 w-1 rounded-full bg-[#00C70D]" />
          ))}
        </div>

        <div className="relative mx-auto grid min-h-[620px] w-full max-w-[1320px] items-center gap-10 px-5 py-14 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div>
            <h1 className="max-w-[620px] text-5xl font-black leading-[1.08] text-[#0D0D0D] sm:text-6xl lg:text-7xl">
              El ERP que impulsa negocios <span className="text-[#00C70D]">saludables</span>
            </h1>
            <p className="mt-7 max-w-[560px] text-lg leading-9 text-[#535353]">
              Kapos centraliza POS, inventario, delivery, clientes y reportes en una sola plataforma simple y poderosa para tu negocio.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#contacto"
                className="inline-flex min-h-14 items-center gap-4 rounded-[10px] bg-[#00C70D] px-8 text-base font-black text-white shadow-[0_18px_34px_rgba(0,199,13,0.24)] transition hover:bg-[#00920A]"
              >
                Solicitar demo
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="#funciones"
                className="inline-flex min-h-14 items-center gap-4 rounded-[10px] bg-[#0D0D0D] px-8 text-base font-black text-white shadow-[0_18px_34px_rgba(13,13,13,0.22)] transition hover:bg-[#1A1A1A]"
              >
                <Play className="h-5 w-5 fill-white" />
                Ver funcionalidades
              </a>
            </div>

            <p className="mt-8 flex items-center gap-2 text-sm text-[#535353]">
              <CheckCircle2 className="h-5 w-5 text-[#00C70D]" />
              Disenado para protein bars, cafeterias saludables y mas.
            </p>
          </div>

          <ErpPreview />
        </div>
      </section>

      <section id="funciones" className="mx-auto w-full max-w-[1320px] px-5 py-10 md:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-[8px] border border-[#E4E4E4] bg-white p-7 shadow-[0_18px_40px_rgba(13,13,13,0.04)]">
              <Icon className="h-10 w-10 text-[#0D0D0D]" strokeWidth={1.8} />
              <h2 className="mt-7 text-lg font-black text-[#0D0D0D]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#535353]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="beneficios" className="mx-auto w-full max-w-[1320px] px-5 py-6 md:px-8">
        <div className="grid gap-5 rounded-[8px] border border-[#B8F5BC] bg-[linear-gradient(90deg,#F8F8F8_0%,#E8FCEB_100%)] px-7 py-8 md:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ label, value, detail, icon: Icon }) => (
            <article key={label} className="flex items-center gap-6 border-[#D8F5DC] lg:border-r lg:last:border-r-0">
              <Icon className="h-12 w-12 shrink-0 text-[#00C70D]" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-[#535353]">{label}</p>
                <strong className="mt-1 block text-2xl font-black text-[#0D0D0D]">{value}</strong>
                <p className="mt-1 text-sm text-[#535353]">{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="planes" className="mx-auto w-full max-w-[1320px] px-5 py-12 text-center md:px-8">
        <h2 className="text-3xl font-black text-[#0D0D0D]">
          Modulos que <span className="text-[#00C70D]">simplifican</span> tu operacion
        </h2>
        <p className="mt-3 text-sm text-[#535353]">Todo lo que tu negocio necesita, en un solo lugar.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {MODULES.map(([title, description, Icon]) => (
            <article key={title} className="rounded-[8px] border border-[#E4E4E4] bg-white p-5 shadow-[0_14px_34px_rgba(13,13,13,0.035)]">
              <Icon className="mx-auto h-10 w-10 text-[#0D0D0D]" strokeWidth={1.8} />
              <h3 className="mt-5 text-sm font-black text-[#0D0D0D]">{title}</h3>
              <p className="mt-3 text-xs leading-6 text-[#535353]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-8">
        <div className="grid items-center gap-7 overflow-hidden rounded-[8px] border border-[#B8F5BC] bg-[linear-gradient(90deg,#E8FCEB_0%,#FFFFFF_62%,#E8FCEB_100%)] px-7 py-8 md:grid-cols-[0.8fr_1.3fr_0.8fr]">
          <div className="flex items-end justify-center gap-4 md:justify-start">
            <div className="h-24 w-28 rotate-[-12deg] rounded-[8px] border border-[#E4E4E4] bg-[linear-gradient(135deg,#8A5A2A_0%,#D7A947_48%,#5B371A_100%)] shadow-[0_18px_30px_rgba(13,13,13,0.14)]" />
            <div className="grid h-28 w-20 place-items-center rounded-b-[18px] rounded-t-[10px] bg-[#0D0D0D] text-5xl font-black text-[#40D653] shadow-[0_18px_30px_rgba(13,13,13,0.16)]">
              K
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black text-[#0D0D0D] md:text-3xl">
              Lleva tu negocio al siguiente nivel con <span className="text-[#00C70D]">Kapos</span>
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#535353]">
              Solicita una demo personalizada y descubre como podemos ayudarte a crecer.
            </p>
            <a
              href="#contacto"
              className="mt-5 inline-flex min-h-12 items-center gap-4 rounded-[8px] bg-[#00C70D] px-8 text-sm font-black text-white shadow-[0_16px_30px_rgba(0,199,13,0.22)] transition hover:bg-[#00920A]"
            >
              Solicitar demo
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="text-center md:text-left">
            <div className="mx-auto flex justify-center -space-x-3 md:justify-start">
              {["AM", "LC", "JR", "KV"].map((initials, index) => (
                <span
                  key={initials}
                  className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-[#F1F1F1] text-xs font-black text-[#0D0D0D]"
                  style={{ transform: `translateY(${index % 2 ? 4 : 0}px)` }}
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[#535353]">Mas de 500 negocios ya confian en Kapos.</p>
          </div>
        </div>
      </section>

      <footer id="contacto" className="border-t border-[#E4E4E4] bg-white">
        <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-5 py-10 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_1fr] md:px-8">
          <div>
            <Image src="/brand/kapos-logo.svg" alt="Kapos" width={158} height={57} className="h-auto w-32" />
            <p className="mt-4 max-w-xs text-sm leading-7 text-[#535353]">
              El ERP en la nube disenado para negocios saludables que buscan crecer con control y simplicidad.
            </p>
            <div className="mt-5 flex gap-3 text-sm font-black text-[#535353]">
              <span>IG</span>
              <span>FB</span>
              <span>TT</span>
              <span>IN</span>
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#0D0D0D]">Producto</h3>
            <div className="mt-4 space-y-3 text-sm text-[#535353]">
              <a href="#funciones" className="block hover:text-[#00C70D]">Funciones</a>
              <a href="#beneficios" className="block hover:text-[#00C70D]">Beneficios</a>
              <a href="#planes" className="block hover:text-[#00C70D]">Planes</a>
              <a href="#planes" className="block hover:text-[#00C70D]">Integraciones</a>
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#0D0D0D]">Empresa</h3>
            <div className="mt-4 space-y-3 text-sm text-[#535353]">
              <a href="#funciones" className="block hover:text-[#00C70D]">Sobre nosotros</a>
              <a href="#contacto" className="block hover:text-[#00C70D]">Blog</a>
              <a href="#contacto" className="block hover:text-[#00C70D]">Soporte</a>
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#0D0D0D]">Legal</h3>
            <div className="mt-4 space-y-3 text-sm text-[#535353]">
              <a href="#contacto" className="block hover:text-[#00C70D]">Terminos y condiciones</a>
              <a href="#contacto" className="block hover:text-[#00C70D]">Politica de privacidad</a>
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#0D0D0D]">Contacto</h3>
            <div className="mt-4 space-y-3 text-sm text-[#535353]">
              <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#00C70D]" />hola@kapos.app</p>
              <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#00C70D]" />+57 300 123 4567</p>
              <p className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#00C70D]" />Medellin, Colombia</p>
            </div>
          </div>
        </div>
        <p className="pb-7 text-center text-xs text-[#535353]">© 2024 Kapos. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}
