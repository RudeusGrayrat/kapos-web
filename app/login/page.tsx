"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Mail, ShoppingCart, UsersRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, isApiError } from "../lib/api";
import { useAuth } from "../context/auth-context";

const benefits = [
  ["Punto de venta", "Rápido, simple y confiable.", ShoppingCart],
  ["Control total", "Tu operación en tiempo real.", BarChart3],
  ["Mejores decisiones", "Con datos que importan.", UsersRound],
] as const;

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link href="/" aria-label="Volver al inicio de Kapos" className="inline-flex items-center gap-3"><Image src="/brand/kapos-k.svg" alt="" width={38} height={42} className="h-9 w-8" priority /><span className={`text-[2rem] font-black italic leading-none tracking-[-0.1em] ${inverse ? "text-white" : "text-[#10110d]"}`}>KAPOS</span></Link>;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(nextPath);
  }, [isAuthenticated, isLoading, nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login({ identifier, password });
      router.replace(nextPath);
    } catch (error) {
      setErrorMessage(isApiError(error) || error instanceof ApiError ? error.messages[0] ?? "No se pudo iniciar sesión." : "Ocurrió un error inesperado al iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="min-h-dvh bg-[#f4f7ef] text-[#11130f] lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1.02fr)_minmax(34rem,.98fr)] lg:overflow-hidden">
    <section className="relative hidden min-h-0 overflow-hidden lg:block">
      <Image src="/promo/kapos-login-cafe-v1.png" alt="Cafeteria moderna con punto de venta" fill priority sizes="52vw" className="object-cover object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,10,5,.93)_0%,rgba(3,10,5,.8)_47%,rgba(3,10,5,.22)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(2,7,4,.72),transparent)]" />
      <div className="relative flex h-full max-w-[41rem] flex-col px-10 py-8 xl:px-16 xl:py-10">
        <div><Brand inverse /><p className="mt-3 text-sm text-white/70">Tu negocio, siempre en control.</p></div>
        <div className="my-auto max-w-[25rem] py-6"><p className="mb-5 flex items-center gap-3 text-[0.68rem] font-bold tracking-[.3em] text-white/55"><span className="h-5 w-0.5 bg-[#82ef4d]" />SISTEMA ERP & POS</p><h1 className="text-5xl font-black leading-[.99] tracking-[-.065em] text-white xl:text-6xl">Gestiona.<br />Vende.<br /><span className="text-[#83ef4d]">Haz crecer</span><br />tu negocio.</h1><p className="mt-6 max-w-sm text-base leading-7 text-white/80">Todo en un solo sistema para bares, cafeterías y negocios gastronómicos.</p><div className="mt-7 space-y-3">{benefits.map(([title, description, Icon]) => <div key={title} className="flex items-center gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#83ef4d]/20 bg-[#74d943]/15 text-[#a6ff72]"><Icon className="h-5 w-5" /></span><div><p className="text-sm font-bold text-white">{title}</p><p className="mt-0.5 text-sm text-white/65">{description}</p></div></div>)}</div></div>
        <div className="text-sm font-semibold text-white"><span className="mr-3 inline-block h-1 w-10 rounded-full bg-[#83ef4d] align-middle" />Negocios más simples. <span className="text-[#83ef4d]">Resultados más grandes.</span></div>
      </div>
    </section>

    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#fbfcf8] px-5 py-10 sm:px-10 lg:min-h-0 lg:px-14 xl:px-20">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#e7f8d8] blur-[1px]" /><div className="pointer-events-none absolute -bottom-36 -left-32 h-72 w-72 rounded-full border-[28px] border-[#dff5ce]" />
      <div className="relative w-full max-w-[31rem]">
        <div className="mb-10 lg:hidden"><Brand /><p className="mt-2 text-sm text-[#6f756b]">Tu negocio, siempre en control.</p></div>
        <div className="rounded-[2rem] border border-white bg-white/94 p-7 shadow-[0_25px_70px_rgba(39,60,23,.12)] backdrop-blur sm:p-10 lg:p-12">
          <div className="text-center"><h2 className="text-3xl font-black tracking-[-.055em] sm:text-4xl">Inicia sesión</h2><p className="mt-2 text-base text-[#6e746a]">Accede a tu cuenta para continuar.</p></div>
          <form onSubmit={handleSubmit} className="mt-9 space-y-4">
            <label className="block"><span className="sr-only">Correo, usuario o DNI</span><span className="relative block"><Mail className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#70776c]" /><input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="w-full rounded-2xl border border-[#dfe4da] bg-white py-4 pl-13 pr-5 text-base outline-none transition placeholder:text-[#8a9086] focus:border-[#39a81b] focus:ring-4 focus:ring-[#e2f7d5]" placeholder="Correo electrónico, usuario o DNI" autoComplete="username" required /></span></label>
            <label className="block"><span className="sr-only">Contraseña</span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#70776c]" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#dfe4da] bg-white py-4 pl-13 pr-14 text-base outline-none transition placeholder:text-[#8a9086] focus:border-[#39a81b] focus:ring-4 focus:ring-[#e2f7d5]" placeholder="Contraseña" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#70776c] transition hover:bg-[#edf5e8] hover:text-[#247e15]" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>
            <div className="flex justify-end pt-1"><Link href="/#contactos" className="text-sm font-bold text-[#16880d] transition hover:text-[#075e04]">¿Olvidaste tu contraseña?</Link></div>
            {errorMessage ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-15 w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(100deg,#11930d,#13b51b)] px-6 text-base font-black text-white shadow-[0_17px_28px_rgba(20,160,20,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(20,160,20,.3)] disabled:cursor-not-allowed disabled:opacity-65">{isSubmitting ? "Ingresando..." : "Iniciar sesión"}<ArrowRight className="h-5 w-5" /></button>
          </form>
          <div className="mt-8 border-t border-[#e5e9e0] pt-6 text-center"><p className="text-sm font-bold">¿Necesitas acceso?</p><Link href="/#contactos" className="mt-1 inline-block text-sm text-[#747a71] transition hover:text-[#16880d]">Contáctanos para conocer Kapos.</Link></div>
        </div>
        <p className="mt-8 text-center text-[0.68rem] font-semibold tracking-[.18em] text-[#83897f]">KAPOS <span className="mx-1.5 text-[#b6bdb0]">|</span> SISTEMA ERP</p>
      </div>
    </section>
  </main>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f8f9f5] text-[#62685c]">Cargando acceso...</main>}><LoginPageContent /></Suspense>;
}
