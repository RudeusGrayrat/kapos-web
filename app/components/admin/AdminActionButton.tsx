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
        ? "border-[#1a1d14] bg-[#171717] text-white shadow-[0_20px_40px_rgba(17,17,17,0.28)]"
        : "border-[#1d1f19] bg-[#111111] text-white shadow-[0_14px_28px_rgba(17,17,17,0.18)] hover:bg-[#1c1d1a]"
      : tone === "accent"
        ? active
          ? "border-[#9fcf1f] bg-[#c7ed4a] text-[#182007] shadow-[0_18px_34px_rgba(180,230,16,0.24)]"
          : "border-[#d6ea95] bg-[#f7fddf] text-[#2c3812] shadow-[0_12px_24px_rgba(180,230,16,0.14)] hover:border-[#b8da4b] hover:bg-[#eef8c7]"
        : tone === "danger"
          ? active
            ? "border-[#3b1717] bg-[#2a1616] text-white shadow-[0_18px_34px_rgba(58,21,21,0.24)]"
            : "border-[#efd6d3] bg-[#fff7f6] text-[#7f2f28] shadow-[0_12px_22px_rgba(127,47,40,0.08)] hover:border-[#ddaaa4] hover:bg-[#fff0ee]"
          : tone === "ghost"
            ? active
              ? "border-[#d7e3b7] bg-[#f5f9e6] text-[#21310f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(64,86,22,0.1)]"
              : "border-transparent bg-transparent text-[#5b654a] hover:border-[#e3e9d3] hover:bg-white/85 hover:text-[#1f280f]"
            : active
              ? "border-[#d3ddba] bg-[#f8fbef] text-[#1d280e] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_28px_rgba(34,44,18,0.08)]"
              : "border-[#e0e7cf] bg-white text-[#4c5935] shadow-[0_12px_24px_rgba(34,44,18,0.05)] hover:border-[#bfd481] hover:bg-[#fcfef7] hover:text-[#1f280f]";

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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4e610] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
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
