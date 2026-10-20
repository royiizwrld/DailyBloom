import { Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, CheckCircle2, ListChecks, Target, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { CoachPanel } from "./coach/CoachPanel";

const NAV = [
  { to: "/", label: "Today", icon: CheckCircle2 },
  { to: "/habits", label: "Habits", icon: ListChecks },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

const COLLAPSE_KEY = "habit-tracker:sidebar-collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"), []);
  const toggle = () => setCollapsed((c) => { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); return !c; });
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className={cn("hidden md:flex md:flex-col md:border-r md:bg-sidebar md:sticky md:top-0 md:h-screen transition-[width] duration-200", collapsed ? "md:w-[72px] md:p-3" : "md:w-60 md:p-5")}>
        <div className={cn("mb-8 flex items-center", collapsed ? "flex-col gap-2 [&>div]:flex-col" : "justify-between")}>
          {collapsed ? (
            <span className="font-display text-xl font-bold text-primary" title="Daily Bloom">B</span>
          ) : (
            <span className="font-display text-xl font-bold">
              Daily <span className="text-primary">Bloom</span>
            </span>
          )}
          <ThemeToggle />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              title={collapsed ? label : undefined}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground", collapsed && "justify-center px-0")}
            >
              <Icon className="size-5 shrink-0" /> {!collapsed && label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn("mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent", collapsed && "justify-center px-0")}
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <><PanelLeftClose className="size-5" /> Collapse</>}
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-display text-lg font-bold">
          Daily <span className="text-primary">Bloom</span>
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground data-[status=active]:text-primary"
          >
            <Icon className="size-6" />
            {label}
          </Link>
        ))}
      </nav>

      <CoachPanel />
    </div>
  );
}
