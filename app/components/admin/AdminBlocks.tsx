import type { ReactNode } from "react";

type HeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#8ea743]">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#18200f] md:text-[3.25rem]">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-8 text-[#59624d] md:text-lg">
          {description}
        </p>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  tone?: "accent" | "dark" | "soft";
};

export function StatCard({
  label,
  value,
  hint,
  tone = "soft",
}: StatCardProps) {
  const toneClass =
    tone === "accent"
      ? "border-[#d8f06c] bg-[linear-gradient(135deg,#fbffe9_0%,#eef8c7_100%)]"
      : tone === "dark"
        ? "border-[#1e1f18] bg-[linear-gradient(135deg,#111111_0%,#23251e_100%)] text-white"
        : "border-[#e9eddc] bg-white";

  const hintClass =
    tone === "dark" ? "text-white/65" : "text-[#667053]";

  return (
    <article
      className={`rounded-[32px] border p-6 shadow-[0_18px_38px_rgba(34,44,18,0.06)] ${toneClass}`}
    >
      <p className={`text-sm ${hintClass}`}>{label}</p>
      <strong className="mt-4 block text-4xl font-semibold tracking-[-0.04em]">{value}</strong>
      <p className={`mt-3 text-sm leading-7 ${hintClass}`}>{hint}</p>
    </article>
  );
}

type PanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function PanelCard({
  title,
  description,
  action,
  children,
}: PanelProps) {
  return (
    <section className="rounded-[34px] border border-[#e9eee0] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(251,252,246,0.95)_100%)] p-6 shadow-[0_20px_44px_rgba(34,44,18,0.05)]">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[#1a210f]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5d664d]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Tag({
  children,
  tone = "soft",
}: {
  children: ReactNode;
  tone?: "soft" | "accent" | "dark" | "warn";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-[#edf8bf] text-[#2d4110]"
      : tone === "dark"
        ? "bg-[#111111] text-white"
        : tone === "warn"
          ? "bg-[#fff3dc] text-[#805e20]"
          : "bg-[#f3f5ed] text-[#53623b]";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-[0_6px_16px_rgba(17,17,17,0.04)] ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function AdminMessage({
  title,
  description,
  tone = "soft",
}: {
  title: string;
  description: string;
  tone?: "soft" | "accent" | "warn";
}) {
  const toneClass =
    tone === "accent"
      ? "border-[#d8f06c] bg-[#fbffe9]"
      : tone === "warn"
        ? "border-[#f1dfb8] bg-[#fff8ea]"
        : "border-[#edf1e4] bg-[#fbfcf8]";

  return (
    <div className={`rounded-[26px] border px-5 py-5 shadow-[0_14px_30px_rgba(34,44,18,0.04)] ${toneClass}`}>
      <p className="font-semibold text-[#1a210f]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[#5d664d]">{description}</p>
    </div>
  );
}
