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
        <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[var(--kapos-success)]">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--kapos-text)] md:text-[3.25rem]">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-8 text-[var(--kapos-text-soft)] md:text-lg">
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
      ? "border-[color-mix(in_srgb,var(--kapos-green)_16%,white)] bg-[linear-gradient(135deg,#ffffff_0%,var(--kapos-green-wash)_100%)]"
      : tone === "dark"
        ? "border-[var(--kapos-black)] bg-[linear-gradient(135deg,var(--kapos-black)_0%,#141414_100%)] text-white"
        : "border-[var(--kapos-border)] bg-[var(--kapos-card)]";

  const hintClass =
    tone === "dark" ? "text-white/65" : "text-[var(--kapos-text-soft)]";

  return (
    <article
      className={`rounded-[24px] border p-6 shadow-[0_18px_38px_rgba(13,13,13,0.06)] ${toneClass}`}
    >
      <p className={`text-sm ${hintClass}`}>{label}</p>
      <strong className="mt-4 block text-4xl font-semibold tracking-[-0.04em]">{value}</strong>
      <p className={`mt-3 text-sm leading-7 ${hintClass}`}>{hint}</p>
    </article>
  );
}

export type AdminModuleStat = StatCardProps & {
  key?: string;
};

type AdminModuleHeaderProps = HeaderProps & {
  stats?: AdminModuleStat[];
  statsColumnsClassName?: string;
};

export function AdminModuleHeader({
  eyebrow,
  title,
  description,
  action,
  stats = [],
  statsColumnsClassName = "md:grid-cols-3",
}: AdminModuleHeaderProps) {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={action}
      />

      {stats.length > 0 ? (
        <div className={`grid gap-4 ${statsColumnsClassName}`}>
          {stats.map((stat) => (
            <StatCard
              key={stat.key ?? stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              tone={stat.tone}
            />
          ))}
        </div>
      ) : null}
    </div>
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
    <section className="rounded-[24px] border border-[var(--kapos-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(248,248,248,0.96)_100%)] p-6 shadow-[0_20px_44px_rgba(13,13,13,0.055)]">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[var(--kapos-text)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--kapos-text-soft)]">
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
      ? "bg-[color-mix(in_srgb,var(--kapos-green)_13%,white)] text-[var(--kapos-green-dark)]"
      : tone === "dark"
        ? "bg-[var(--kapos-black)] text-white"
        : tone === "warn"
          ? "bg-[color-mix(in_srgb,var(--kapos-warning)_14%,white)] text-[var(--kapos-warning)]"
          : "bg-[var(--kapos-card-alt)] text-[var(--kapos-text-soft)]";

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
      ? "border-[color-mix(in_srgb,var(--kapos-green)_18%,white)] bg-[var(--kapos-green-wash)]"
      : tone === "warn"
        ? "border-[color-mix(in_srgb,var(--kapos-warning)_42%,white)] bg-[color-mix(in_srgb,var(--kapos-warning)_10%,white)]"
        : "border-[var(--kapos-border)] bg-[var(--kapos-card-alt)]";

  return (
    <div className={`rounded-[22px] border px-5 py-5 shadow-[0_14px_30px_rgba(13,13,13,0.04)] ${toneClass}`}>
      <p className="font-semibold text-[var(--kapos-text)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--kapos-text-soft)]">{description}</p>
    </div>
  );
}
