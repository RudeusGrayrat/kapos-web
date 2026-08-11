"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AdminActionButton } from "../components/admin/AdminActionButton";

type ErpErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErpError({ error, reset }: ErpErrorProps) {
  useEffect(() => {
    console.error("ERP route error:", error);
  }, [error]);

  return (
    <section className="grid min-h-[calc(100vh-10rem)] place-items-center">
      <div className="w-full max-w-3xl rounded-[36px] border border-[#eadfd7] bg-[radial-gradient(circle_at_top,#ffffff_0%,#fffdfa_58%,#fcf7f2_100%)] p-8 text-center shadow-[0_24px_60px_rgba(17,17,17,0.08)] md:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#f1d8c5] bg-[#fff4eb] text-[#d97706] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <AlertTriangle className="h-9 w-9" strokeWidth={2.1} />
        </div>

        <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#c68528]">
          Kapos ERP
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#27170a] md:text-5xl">
          Ups, ocurrio un error
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6d5643] md:text-base">
          Esta vista existe, pero algo fallo mientras se intentaba renderizar o
          cargar su contenido. El sidebar sigue disponible para que no pierdas el
          contexto del ERP.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <AdminActionButton
            tone="primary"
            icon={<RotateCcw className="h-4 w-4" strokeWidth={2.2} />}
            onClick={reset}
          >
            Reintentar
          </AdminActionButton>
          <Link href="/dashboard">
            <AdminActionButton tone="secondary">Ir al dashboard</AdminActionButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
