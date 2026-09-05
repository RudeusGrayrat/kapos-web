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
import { publicSite } from "./config/public-site";

const PUBLIC_NAV = [
  { label: "Funciones", href: "#funciones" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

const FEATURES = [
  {
    title: "Pedidos inteligentes",
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
  ["Ventas y pedidos", "Cobros agiles, multiples medios de pago y propinas.", ShoppingBag],
  ["Inventario", "Lotes, fechas de vencimiento, recetas y alertas.", Package],
  ["Clientes", "Historial de compras y segmentacion.", UsersRound],
  ["Fidelizacion", "Puntos, niveles y promociones personalizadas.", BadgePercent],
  ["Delivery", "Gestion de pedidos y control de repartidores.", Truck],
  ["Reportes", "Dashboards claros y KPIs en tiempo real.", BarChart3],
  ["Configuracion", "Catalogos, usuarios y permisos.", Settings],
  ["Nube segura", "Accede desde cualquier lugar y dispositivo.", Cloud],
] as const;

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.7 21v-8h2.7l.4-3.1h-3.1V7.92c0-.9.25-1.52 1.56-1.52H16.9V3.62A22.6 22.6 0 0 0 14.5 3.5c-2.37 0-4 1.45-4 4.1v2.3H7.8V13h2.7v8h3.2Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M15.2 3c.36 2.47 1.75 3.94 4.1 4.1v3.1a8.2 8.2 0 0 1-4.04-1.18v6.24a5.77 5.77 0 1 1-5-5.72v3.18a2.68 2.68 0 1 0 1.88 2.56V3h3.06Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.1 8.4H3V21h3.1V8.4ZM4.55 3A1.8 1.8 0 1 0 4.6 6.6 1.8 1.8 0 0 0 4.55 3ZM21 13.8c0-3.8-2-5.6-4.7-5.6-2.17 0-3.15 1.2-3.7 2.04V8.4H9.5V21h3.1v-6.24c0-1.64.3-3.22 2.34-3.22 2 0 2.03 1.88 2.03 3.33V21H20v-7.2Z" />
    </svg>
  );
}

function ErpPreview() {
  return (
    <div className="relative  w-full max-w-[880px]">
      <Image
        src="/promo/kapos-dashboard-promo-v3.png"
        alt="Dashboard de Kapos con ventas, inventario y accesos operativos"
        width={1680}
        height={940}
        priority
        className="h-auto w-full rounded-[24px] border border-[#E4E4E4] bg-white shadow-[0_38px_80px_rgba(13,13,13,0.18)]"
      />
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

        <div className="relative mx-auto flex flex-wrap justify-center items-center min-h-[620px] w-full max-w-[1820px] items-center gap-1 px-5 py-14 md:px-8 lg:py-20">
          <div>
            <h1 className="max-w-[620px] text-5xl font-black leading-[1.08] text-[#0D0D0D] sm:text-6xl lg:text-7xl">
              El ERP que impulsa negocios <span className="text-[#00C70D]">saludables</span>
            </h1>
            <p className="mt-7 max-w-[560px] text-lg leading-9 text-[#535353]">
              Kapos centraliza pedidos, inventario, delivery, clientes y reportes en una sola plataforma simple y poderosa para tu negocio.
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
        <div className="grid items-center gap-8 overflow-hidden rounded-[20px] border border-[#B8F5BC] bg-[linear-gradient(90deg,#E8FCEB_0%,#FFFFFF_62%,#E8FCEB_100%)] p-5 sm:p-7 md:grid-cols-[1fr_1.1fr]">
          <div className="overflow-hidden rounded-[16px] border border-[#E4E4E4] bg-white shadow-[0_18px_36px_rgba(13,13,13,0.12)]">
            <Image
              src="/promo/kapos-dashboard-promo-v3.png"
              alt="Dashboard de Kapos con ventas, inventario y accesos operativos"
              width={1680}
              height={940}
              className="h-auto w-full"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black text-[#0D0D0D] md:text-3xl">
              Lleva tu negocio al siguiente nivel con <span className="text-[#00C70D]">Kapos</span>
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#535353]">
              Solicita una demo personalizada y descubre como podemos ayudarte a crecer.
            </p>
            <div className="mt-5 grid gap-3 text-left sm:grid-cols-2">
              <p className="flex items-center gap-3 text-sm font-semibold text-[#0D0D0D]"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#00C70D]" />Recorre el ERP con tu operación.</p>
              <p className="flex items-center gap-3 text-sm font-semibold text-[#0D0D0D]"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#00C70D]" />Resuelve tus dudas antes de empezar.</p>
            </div>
            <a
              href="#contacto"
              className="mt-5 inline-flex min-h-12 items-center gap-4 rounded-[8px] bg-[#00C70D] px-8 text-sm font-black text-white shadow-[0_16px_30px_rgba(0,199,13,0.22)] transition hover:bg-[#00920A]"
            >
              Solicitar demo
              <ArrowRight className="h-4 w-4" />
            </a>
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
            <div className="mt-5 flex gap-3">
              {publicSite.social.instagramUrl ? (
                <a href={publicSite.social.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram de Kapos" className="grid h-10 w-10 place-items-center rounded-full border border-[#E4E4E4] text-[#0D0D0D] transition hover:border-[#00C70D] hover:bg-[#E8FCEB] hover:text-[#00920A]">
                  <InstagramIcon className="h-5 w-5" />
                </a>
              ) : null}
              {publicSite.social.facebookUrl ? (
                <a href={publicSite.social.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook de Kapos" className="grid h-10 w-10 place-items-center rounded-full border border-[#E4E4E4] text-[#0D0D0D] transition hover:border-[#00C70D] hover:bg-[#E8FCEB] hover:text-[#00920A]">
                  <FacebookIcon className="h-5 w-5" />
                </a>
              ) : null}
              {publicSite.social.tiktokUrl ? (
                <a href={publicSite.social.tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok de Kapos" className="grid h-10 w-10 place-items-center rounded-full border border-[#E4E4E4] text-[#0D0D0D] transition hover:border-[#00C70D] hover:bg-[#E8FCEB] hover:text-[#00920A]">
                  <TikTokIcon className="h-5 w-5" />
                </a>
              ) : null}
              {publicSite.social.linkedinUrl ? (
                <a href={publicSite.social.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn de Kapos" className="grid h-10 w-10 place-items-center rounded-full border border-[#E4E4E4] text-[#0D0D0D] transition hover:border-[#00C70D] hover:bg-[#E8FCEB] hover:text-[#00920A]">
                  <LinkedInIcon className="h-5 w-5" />
                </a>
              ) : null}
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
              {publicSite.contact.email ? (
                <a href={`mailto:${publicSite.contact.email}`} className="flex items-center gap-3 hover:text-[#00920A]">
                  <Mail className="h-4 w-4 shrink-0 text-[#00C70D]" />
                  {publicSite.contact.email}
                </a>
              ) : null}
              {publicSite.contact.phone ? (
                <a href={`tel:${publicSite.contact.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 hover:text-[#00920A]">
                  <Phone className="h-4 w-4 shrink-0 text-[#00C70D]" />
                  {publicSite.contact.phone}
                </a>
              ) : null}
              {publicSite.contact.whatsappUrl ? (
                <a href={publicSite.contact.whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#00920A]">
                  <Phone className="h-4 w-4 shrink-0 text-[#00C70D]" />
                  WhatsApp
                </a>
              ) : null}
              {publicSite.contact.address ? (
                publicSite.contact.mapsUrl ? (
                  <a href={publicSite.contact.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[#00920A]">
                    <MapPin className="h-4 w-4 shrink-0 text-[#00C70D]" />
                    {publicSite.contact.address}
                  </a>
                ) : (
                  <p className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0 text-[#00C70D]" />{publicSite.contact.address}</p>
                )
              ) : null}
            </div>
          </div>
        </div>
        <p className="pb-7 text-center text-xs text-[#535353]">© 2024 Kapos. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}
