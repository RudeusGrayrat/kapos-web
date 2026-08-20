"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

type AdminActionButtonTone =
  | "primary"
  | "secondary"
  | "ghost"
  | "accent"
  | "danger";

type AdminActionButtonSize = "sm" | "md" | "icon";

type AdminActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  active?: boolean;
  tone?: AdminActionButtonTone;
  size?: AdminActionButtonSize;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AdminActionButton({
  children,
  className,
  icon,
  active = false,
  tone = "secondary",
  size = "md",
  type = "button",
  ...props
}: AdminActionButtonProps) {
  const toneClass =
    tone === "primary"
      ? active
        ? "border-[var(--kapos-charcoal)] bg-[var(--kapos-black)] text-white shadow-[0_20px_40px_rgba(12,13,15,0.28)]"
        : "border-[var(--kapos-charcoal)] bg-[var(--kapos-black)] text-white shadow-[0_14px_28px_rgba(12,13,15,0.18)] hover:bg-[var(--kapos-charcoal)]"
      : tone === "accent"
        ? active
          ? "border-[var(--kapos-lime)] bg-[var(--kapos-lime)] text-[var(--kapos-text)] shadow-[0_18px_34px_rgba(184,242,12,0.24)]"
          : "border-[var(--kapos-border-strong)] bg-[var(--kapos-lime-wash)] text-[var(--kapos-text)] shadow-[0_12px_24px_rgba(184,242,12,0.14)] hover:border-[var(--kapos-lime)] hover:bg-[var(--kapos-lime-soft)]"
        : tone === "danger"
          ? active
            ? "border-[var(--kapos-danger)] bg-[var(--kapos-danger)] text-white shadow-[0_18px_34px_rgba(211,95,72,0.24)]"
            : "border-[color-mix(in_srgb,var(--kapos-danger)_34%,white)] bg-[color-mix(in_srgb,var(--kapos-danger)_7%,white)] text-[var(--kapos-danger)] shadow-[0_12px_22px_rgba(211,95,72,0.08)] hover:border-[var(--kapos-danger)] hover:bg-[color-mix(in_srgb,var(--kapos-danger)_11%,white)]"
          : tone === "ghost"
            ? active
              ? "border-[var(--kapos-border-strong)] bg-[var(--kapos-lime-wash)] text-[var(--kapos-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(32,36,21,0.1)]"
              : "border-transparent bg-transparent text-[var(--kapos-text-soft)] hover:border-[var(--kapos-border)] hover:bg-white/85 hover:text-[var(--kapos-text)]"
            : active
              ? "border-[var(--kapos-border-strong)] bg-[var(--kapos-card-alt)] text-[var(--kapos-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_28px_rgba(32,36,21,0.08)]"
              : "border-[var(--kapos-border)] bg-[var(--kapos-card)] text-[var(--kapos-text-soft)] shadow-[0_12px_24px_rgba(32,36,21,0.05)] hover:border-[var(--kapos-border-strong)] hover:bg-[var(--kapos-lime-wash)] hover:text-[var(--kapos-text)]";

  const sizeClass =
    size === "sm"
      ? "min-h-10 gap-2 px-3.5 text-xs"
      : size === "icon"
        ? "h-10 w-10 justify-center rounded-2xl px-0"
        : "min-h-12 gap-2.5 px-5 text-sm";

  return (
    <button
      type={type}
      className={joinClasses(
        "inline-flex items-center justify-center rounded-full border font-semibold tracking-[-0.01em] transition duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kapos-lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:translate-y-[1px]",
        sizeClass,
        toneClass,
        className,
      )}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

type IconProps = {
  className?: string;
};

export function PlusIcon(props: IconProps) {
  return <Plus className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}

export function EyeIcon(props: IconProps) {
  return <Eye className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}

export function PencilIcon(props: IconProps) {
  return <Pencil className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}

export function TrashIcon(props: IconProps) {
  return <Trash2 className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}

export function ArrowLeftIcon(props: IconProps) {
  return <ArrowLeft className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}

export function CloseIcon(props: IconProps) {
  return <X className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}

export function SparkIcon(props: IconProps) {
  return <Sparkles className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}

export function CheckIcon(props: IconProps) {
  return <Check className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}

export function UserPlusIcon(props: IconProps) {
  return <UserPlus className={joinClasses("h-4 w-4", props.className)} aria-hidden="true" />;
}
