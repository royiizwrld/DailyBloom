import { Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, CheckCircle2, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { CoachPanel } from "./coach/CoachPanel";

const NAV = [
  { to: "/", label: "Today", icon: CheckCircle2 },
  { to: "/habits", label: "Habits", icon: ListChecks },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-sidebar md:p-5 md:sticky md:top-0 md:h-screen">
        <div className="mb-8 flex items-center justify-between">
          <span className="font-display text-xl font-bold">
            Daily<span className="text-primary">.</span>
          </span>
          <ThemeToggle />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
            >
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-display text-lg font-bold">
          Daily<span className="text-primary">.</span>
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card/95 backdrop-blur md:hidden">
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
