"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, Check, Cloud, LayoutDashboard, ReceiptText, Settings2, ShieldCheck, ShoppingBag, UsersRound, WalletCards, Zap } from "lucide-react";
import { useAuth } from "./context/auth-context";
import { publicSite } from "./config/public-site";

const navigation = [
  { label: "Funciones", href: "#funciones" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Módulos", href: "#modulos" },
  { label: "Contacto", href: "#contactos" },
];

const highlights = [
  ["Pedidos y caja", "Registra pedidos, pagos y comprobantes desde una misma operación.", ShoppingBag],
  ["Inventario conectado", "Controla productos, costos, stock y movimientos por sucursal.", Boxes],
  ["Clientes", "Conserva perfiles e historial para atender mejor a cada cliente.", UsersRound],
  ["Reportes claros", "Observa ventas, rentabilidad y operación sin cambiar de herramienta.", BarChart3],
] as const;

const modules = [
  ["Ventas", "Pedidos, cobros y comprobantes", ReceiptText],
  ["Inventario", "Productos, costos y stock", Boxes],
  ["Clientes", "Perfiles e historial", UsersRound],
  ["Caja", "Aperturas, cierres y movimientos", WalletCards],
  ["Finanzas", "Gastos, metas y rentabilidad", BarChart3],
  ["Configuración", "Usuarios, roles y sucursales", Settings2],
  ["Nube", "Tu información centralizada", Cloud],
] as const;

function Brand() {
  return <Link href="/" aria-label="Kapos" className="inline-flex items-center gap-2.5"><Image src="/brand/kapos-k.svg" alt="" width={42} height={42} className="h-8 w-8" priority /><span className="text-[1.55rem] font-black tracking-[-0.06em] text-white">Kapos</span></Link>;
}

function LaptopMockup() {
  return <div className="landing-float relative mx-auto w-full max-w-[720px] pt-7 lg:pt-0"><div className="absolute -right-14 top-6 h-52 w-52 rounded-full bg-[#b8ff1e]/30 blur-[85px]" /><div className="absolute -left-8 bottom-12 h-40 w-40 rounded-full bg-[#57ff13]/20 blur-[65px]" /><div className="relative rounded-[22px] border border-white/45 bg-[#111] p-2 shadow-[0_38px_90px_rgba(0,0,0,0.72)] [transform:perspective(1400px)_rotateY(-5deg)_rotateX(3deg)]"><div className="overflow-hidden rounded-[14px] border border-white/10 bg-white"><Image src="/promo/kapos-dashboard-promo-v3.png" alt="Dashboard real de Kapos" width={1680} height={940} priority className="h-auto w-full" /></div></div><div className="relative mx-auto h-4 w-[92%] rounded-b-[100%] bg-[linear-gradient(180deg,#5c5c5c_0%,#151515_42%,#060606_100%)] shadow-[0_20px_24px_rgba(0,0,0,0.75)]" /><div className="relative mx-auto h-2 w-[45%] rounded-b-full bg-[#080808]" /></div>;
}

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const erpHref = isAuthenticated ? "/dashboard" : "/login";

  return <main className="overflow-hidden bg-[#f7f7f4] text-[#10110d]">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080908]/95 backdrop-blur-xl"><div className="mx-auto flex h-[72px] w-full max-w-[1360px] items-center justify-between px-5 md:px-8"><Brand /><nav className="hidden items-center gap-9 lg:flex" aria-label="Navegación principal">{navigation.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold text-white/80 transition hover:text-[#b8ff1e]">{item.label}</a>)}</nav><Link href={erpHref} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#b8ff1e] px-4 text-sm font-black text-[#0a0b08] transition hover:-translate-y-0.5 hover:bg-[#d1ff62] sm:px-5">{isLoading ? "Cargando" : "Ir al ERP"}<ArrowRight className="h-4 w-4" /></Link></div></header>

    <section className="relative isolate overflow-hidden bg-[#080908] text-white"><div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(184,255,30,.48)_1px,transparent_0)] [background-size:14px_14px] [mask-image:linear-gradient(90deg,black,transparent_38%)]" /><div className="absolute right-[5%] top-0 h-[520px] w-[520px] rounded-full bg-[#86e817]/20 blur-[145px]" /><div className="relative mx-auto grid min-h-[650px] w-full max-w-[1360px] items-center gap-10 px-5 py-16 md:px-8 lg:grid-cols-[.88fr_1.12fr] lg:py-20"><div className="landing-rise relative"><p className="inline-flex items-center gap-2 rounded-full border border-[#b8ff1e]/30 bg-[#b8ff1e]/10 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-[#cfff70]">OPERACIÓN CONECTADA</p><h1 className="mt-7 max-w-[660px] text-5xl font-black leading-[.98] tracking-[-0.065em] sm:text-6xl lg:text-7xl">El ERP que ordena tu negocio <span className="text-[#b8ff1e]">de verdad.</span></h1><p className="mt-7 max-w-[550px] text-base leading-8 text-white/68 sm:text-lg">Kapos reúne pedidos, inventario, caja, clientes y finanzas para que tu equipo opere con claridad todos los días.</p><div className="mt-9 flex flex-wrap gap-3"><a href="#contactos" className="inline-flex min-h-13 items-center gap-3 rounded-xl bg-[#b8ff1e] px-6 text-sm font-black text-[#0a0b08] shadow-[0_18px_35px_rgba(184,255,30,.22)] transition hover:-translate-y-0.5 hover:bg-[#d1ff62]">Solicitar demo <ArrowRight className="h-4 w-4" /></a><a href="#funciones" className="inline-flex min-h-13 items-center gap-3 rounded-xl border border-white/35 px-6 text-sm font-bold text-white transition hover:border-[#b8ff1e] hover:text-[#b8ff1e]">Explorar funciones</a></div><p className="mt-8 flex items-center gap-2 text-sm text-white/65"><Check className="h-4 w-4 text-[#b8ff1e]" />Hecho para operaciones que necesitan control, no más hojas sueltas.</p></div><LaptopMockup /></div></section>

    <section id="funciones" className="relative z-10 mx-auto -mt-7 w-full max-w-[1360px] px-5 md:px-8"><div className="grid gap-3 rounded-[28px] border border-black/8 bg-white p-3 shadow-[0_22px_55px_rgba(21,25,13,.11)] md:grid-cols-2 lg:grid-cols-4">{highlights.map(([title, description, Icon], index) => <article key={title} className="group rounded-[20px] p-5 transition hover:bg-[#f2ffd7]"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#10110d] text-[#b8ff1e] transition group-hover:scale-105"><Icon className="h-5 w-5" /></span><p className="mt-6 text-sm font-black">{title}</p><p className="mt-2 text-sm leading-6 text-[#64675f]">{description}</p><span className="mt-5 block text-xs font-bold text-[#7a7f72]">0{index + 1}</span></article>)}</div></section>

    <section id="beneficios" className="mx-auto w-full max-w-[1360px] px-5 py-20 md:px-8"><div className="grid overflow-hidden rounded-[30px] bg-[#151714] text-white lg:grid-cols-[.85fr_1.15fr]"><div className="relative overflow-hidden p-9 md:p-12"><div className="absolute -bottom-16 -left-14 h-52 w-52 rounded-full bg-[#b8ff1e]/25 blur-[70px]" /><p className="relative text-xs font-bold tracking-[.18em] text-[#b8ff1e]">UNA OPERACIÓN, UNA FUENTE DE VERDAD</p><h2 className="relative mt-5 text-4xl font-black leading-tight tracking-[-.05em]">Menos incertidumbre.<br /><span className="text-[#b8ff1e]">Más decisiones claras.</span></h2><p className="relative mt-6 max-w-md text-sm leading-7 text-white/65">Cada venta puede alimentar caja, inventario, clientes y reportes, manteniendo la operación conectada.</p></div><div className="grid gap-px bg-white/15 sm:grid-cols-2"><article className="bg-[#151714] p-8"><Zap className="h-8 w-8 text-[#b8ff1e]" /><p className="mt-8 text-3xl font-black">Ágil</p><p className="mt-2 text-sm text-white/60">Pedidos y cobros dentro del mismo flujo.</p></article><article className="bg-[#151714] p-8"><ShieldCheck className="h-8 w-8 text-[#b8ff1e]" /><p className="mt-8 text-3xl font-black">Trazable</p><p className="mt-2 text-sm text-white/60">Roles, movimientos y datos centralizados.</p></article><article className="bg-[#151714] p-8"><LayoutDashboard className="h-8 w-8 text-[#b8ff1e]" /><p className="mt-8 text-3xl font-black">Visible</p><p className="mt-2 text-sm text-white/60">Indicadores para entender tu operación.</p></article><article className="bg-[#151714] p-8"><Cloud className="h-8 w-8 text-[#b8ff1e]" /><p className="mt-8 text-3xl font-black">Central</p><p className="mt-2 text-sm text-white/60">Información organizada por empresa y sucursal.</p></article></div></div></section>

    <section id="modulos" className="mx-auto w-full max-w-[1360px] px-5 pb-20 text-center md:px-8"><p className="text-xs font-bold tracking-[.18em] text-[#6f9d00]">KAPOS ERP</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em]">Módulos para <span className="text-[#75ae00]">operar mejor.</span></h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#64675f]">Una base común para que el negocio no dependa de procesos aislados.</p><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{modules.map(([title, description, Icon]) => <article key={title} className="group min-h-48 rounded-[22px] border border-black/8 bg-white p-5 text-left shadow-[0_10px_28px_rgba(20,24,15,.04)] transition hover:-translate-y-1 hover:border-[#b8e853] hover:shadow-[0_18px_36px_rgba(92,133,0,.14)]"><Icon className="h-7 w-7 text-[#141612] transition group-hover:text-[#75ae00]" strokeWidth={1.7} /><h3 className="mt-9 text-sm font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-[#73776e]">{description}</p></article>)}</div></section>

    <section className="mx-auto w-full max-w-[1360px] px-5 pb-20 md:px-8"><div className="relative overflow-hidden rounded-[30px] bg-[#0c0d0b] px-7 py-11 text-white md:px-12"><div className="absolute right-0 top-0 h-full w-2/5 bg-[radial-gradient(circle_at_center,rgba(184,255,30,.35),transparent_65%)]" /><div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center"><div><p className="text-xs font-bold tracking-[.16em] text-[#b8ff1e]">EMPIEZA CON UNA DEMO</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em] md:text-4xl">Ve cómo Kapos encaja<br />en tu operación.</h2></div><a href="#contactos" className="inline-flex min-h-13 items-center gap-3 rounded-xl bg-[#b8ff1e] px-6 text-sm font-black text-[#090a07] transition hover:-translate-y-0.5 hover:bg-[#d1ff62]">Hablemos <ArrowRight className="h-4 w-4" /></a></div></div></section>

    <footer id="contactos" className="bg-[#0c0d0b] text-white"><div className="mx-auto grid w-full max-w-[1360px] gap-10 px-5 py-12 md:grid-cols-[1.3fr_.8fr_.9fr] md:px-8"><div><Brand /><p className="mt-5 max-w-sm text-sm leading-7 text-white/55">ERP para centralizar las operaciones que sostienen el crecimiento de tu negocio.</p></div><div><p className="text-sm font-black">Explora</p><div className="mt-4 space-y-2 text-sm text-white/55">{navigation.map((item) => <a className="block transition hover:text-[#b8ff1e]" href={item.href} key={item.href}>{item.label}</a>)}</div></div><div><p className="text-sm font-black">Contacto</p><div className="mt-4 space-y-2 text-sm text-white/55">{publicSite.contact.email ? <a className="block transition hover:text-[#b8ff1e]" href={`mailto:${publicSite.contact.email}`}>{publicSite.contact.email}</a> : <p>Solicita una demo para conversar.</p>}{publicSite.contact.phone ? <a className="block transition hover:text-[#b8ff1e]" href={`tel:${publicSite.contact.phone.replace(/[^+\d]/g, "")}`}>{publicSite.contact.phone}</a> : null}{publicSite.contact.whatsappUrl ? <a className="block transition hover:text-[#b8ff1e]" href={publicSite.contact.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a> : null}</div></div></div><p className="border-t border-white/10 py-5 text-center text-xs text-white/35">© {new Date().getFullYear()} Kapos. Todos los derechos reservados.</p></footer>
  </main>;
}
