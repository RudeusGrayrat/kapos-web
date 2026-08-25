"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, isApiError } from "../lib/api";
import { useAuth } from "../context/auth-context";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ identifier, password });
      router.replace(nextPath);
    } catch (error) {
      if (isApiError(error)) {
        setErrorMessage(error.messages[0] ?? "No se pudo iniciar sesion.");
      } else if (error instanceof ApiError) {
        setErrorMessage(error.messages[0] ?? "No se pudo iniciar sesion.");
      } else {
        setErrorMessage("Ocurrio un error inesperado al iniciar sesion.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#F8F8F8_48%,#F1F1F1_100%)] px-6 py-10">
      <div className="mx-auto grid w-full max-w-[1120px] overflow-hidden rounded-[42px] border border-[#E4E4E4] bg-white/80 shadow-[0_35px_90px_rgba(66,49,14,0.12)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-[linear-gradient(180deg,#0D0D0D_0%,#1A1A1A_100%)] p-8 text-white md:p-10">
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Volver al landing
          </Link>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Ingresa al ERP protegido de Kapos.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/75">
            Despues del login el usuario entra al dashboard y desde ese punto
            el sidebar siempre se mantiene como estructura fija del sistema.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Landing publico separado del shell privado.",
              "Rutas ERP bloqueadas si no existe sesion.",
              "Sidebar por modulos con submodulos laterales.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 text-sm text-white/85 backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#00C70D]">
            Iniciar sesion
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[#0D0D0D]">
            Accede a tu espacio de trabajo
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#535353]">
            Ingresa con tu acceso ERP de Kapos. En local tendras un usuario
            maestro para administrar organizaciones, cuentas, permisos y
            modulos desde la base del sistema.
          </p>
          <div className="mt-4 rounded-[20px] border border-[#B8F5BC] bg-[#E8FCEB] px-4 py-3 text-sm text-[#0D0D0D]">
            Acceso local inicial: usuario <strong>ADMIN</strong> o correo{" "}
            <strong>admin@kapos.local</strong> con contrasena{" "}
            <strong>admin</strong>. Ese usuario solo existe como superadmin de
            Kapos; desde ahi tu crearas empresas como Basti y asignaras sus
            owners, permisos y modulos.
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">
                Usuario, correo o identificador
              </span>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="w-full rounded-[20px] border border-[#E4E4E4] bg-[#ffffff] px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#0D0D0D]"
                placeholder="admin, correo@empresa.com o identificador"
                autoComplete="username"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">
                Contrasena
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[20px] border border-[#E4E4E4] bg-[#ffffff] px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#0D0D0D]"
                placeholder="Ingresa tu contrasena"
                autoComplete="current-password"
                required
              />
            </label>

            {errorMessage ? (
              <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#0D0D0D] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(47,60,29,0.2)] transition hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Ingresando..." : "Entrar al dashboard"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#F8F8F8] text-[#535353]">
          Cargando acceso ERP...
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
