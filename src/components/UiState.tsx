import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function LoadingState({ label = "Загрузка..." }: { label?: string }) {
  return (
    <div className="rounded-[8px] border border-border bg-surface px-5 py-10 text-center text-[13px] text-text2">
      {label}
    </div>
  );
}

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="rounded-[8px] border border-border bg-surface px-5 py-10 text-center">
      <div className="text-[16px] font-semibold text-text">{title}</div>
      {description && <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-5 text-text2">{description}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-[7px] bg-gold px-4 py-2 text-[13px] font-medium text-white hover:bg-gold-hover"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function Alert({
  children,
  tone = "danger",
}: {
  children: ReactNode;
  tone?: "danger" | "success" | "info";
}) {
  const className = {
    danger: "border-danger/20 bg-danger-bg text-danger",
    success: "border-green-200 bg-green-50 text-green-700",
    info: "border-gold-border bg-gold-light text-text",
  }[tone];

  return (
    <div className={`rounded-[7px] border px-4 py-2.5 text-[13px] ${className}`} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[26px] font-semibold text-text">{title}</h1>
      {description && <p className="mt-2 text-[14px] leading-6 text-text2">{description}</p>}
    </div>
  );
}
