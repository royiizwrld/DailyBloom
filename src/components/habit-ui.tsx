import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { HabitColor } from "@/types/habit";

export const habitStyle = (color: HabitColor) => ({ "--habit": `var(--habit-${color})` }) as CSSProperties;

export function HabitBadge({ icon, color, className }: { icon: string; color: HabitColor; className?: string }) {
  return (
    <span
      style={habitStyle(color)}
      className={cn("habit-tint inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl", className)}
      aria-hidden
    >
      {icon}
    </span>
  );
}

export function ProgressRing({ value, size = 88, children }: { value: number; size?: number; children?: ReactNode }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} className="fill-none stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, value))}
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
