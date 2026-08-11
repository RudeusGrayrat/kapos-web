"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastTone = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: string;
  tone: ToastTone;
  summary: string;
  detail: string;
};

type ToastContextValue = {
  showSuccess: (detail: unknown, summary?: string) => void;
  showError: (detail: unknown, summary?: string) => void;
  showWarning: (detail: unknown, summary?: string) => void;
  showInfo: (detail: unknown, summary?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-[#cdea54] bg-[linear-gradient(135deg,#fbffe9_0%,#eef8c7_100%)] text-[#22320d]",
  },
  error: {
    icon: XCircle,
    className: "border-[#f1c6b8] bg-[linear-gradient(135deg,#fff7f2_0%,#ffe9de_100%)] text-[#5f2418]",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-[#efdba8] bg-[linear-gradient(135deg,#fffaf0_0%,#fff0ca_100%)] text-[#5d4312]",
  },
  info: {
    icon: Info,
    className: "border-[#dde8cf] bg-[linear-gradient(135deg,#ffffff_0%,#f4f7ed_100%)] text-[#26331a]",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (tone: ToastTone, detail: unknown, summary: string) => {
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const nextToast = {
        id,
        tone,
        summary,
        detail: normalizeToastDetail(detail),
      };

      setToasts((current) => [nextToast, ...current].slice(0, 4));
      window.setTimeout(() => removeToast(id), 5000);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (detail, summary = "Correcto") => showToast("success", detail, summary),
      showError: (detail, summary = "Error") => showToast("error", detail, summary),
      showWarning: (detail, summary = "Advertencia") => showToast("warning", detail, summary),
      showInfo: (detail, summary = "Informacion") => showToast("info", detail, summary),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-5 top-5 z-[10000] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = toneStyles[toast.tone].icon;

          return (
            <article
              key={toast.id}
              className={`pointer-events-auto flex gap-3 rounded-[26px] border p-4 shadow-[0_22px_55px_rgba(18,24,11,0.16)] backdrop-blur-xl ${toneStyles[toast.tone].className}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/70 shadow-inner">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{toast.summary}</p>
                <p className="mt-1 text-sm leading-6 opacity-75">{toast.detail}</p>
              </div>
              <button
                type="button"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-white/50 transition hover:bg-white"
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificacion"
              >
                <X className="size-4" />
              </button>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }

  return context;
}

function normalizeToastDetail(detail: unknown) {
  if (detail instanceof Error) return detail.message;
  if (typeof detail === "string") return detail;
  if (typeof detail === "object" && detail !== null && "message" in detail) {
    const message = (detail as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }

  return "Operacion completada.";
}
