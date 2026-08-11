"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AdminActionButton,
  CloseIcon,
} from "./AdminActionButton";

type AdminOverlayPanelProps = {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminOverlayPanel({
  open,
  onClose,
  eyebrow = "Detalle",
  title,
  description,
  children,
  footer,
}: AdminOverlayPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-[rgba(10,10,10,0.16)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex h-full w-full justify-center items-center p-3 md:p-4">
        <section
          className="relative flex max-h-[80vh] w-full max-w-[68rem] flex-col overflow-hidden rounded-[36px] border border-[#e7edd5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,241,0.98)_100%)] shadow-[0_30px_80px_rgba(18,24,11,0.18)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="absolute right-5 top-5 z-10">
            <AdminActionButton
              aria-label="Cerrar panel"
              icon={<CloseIcon />}
              onClick={onClose}
              size="icon"
              tone="ghost"
            />
          </div>

          <div className="overflow-y-auto px-6 pb-6 pt-8 md:px-8 md:pb-8 md:pt-10">
            <div className="max-w-[26rem]">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#91aa47]">
                {eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#18200f]">
                {title}
              </h2>
              {description ? (
                <p className="mt-3 text-sm leading-7 text-[#5a6647] md:text-base">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="mt-8">{children}</div>
          </div>

          {footer ? (
            <div className="border-t border-[#e8eddc] bg-white/70 px-6 py-4 md:px-8">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>,
    document.body,
  );
}
