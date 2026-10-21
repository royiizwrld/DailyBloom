import { createFileRoute, Link } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { ArrowLeft, Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { HabitBadge, PageHeader, StatTile } from "@/components/habit-ui";
import { HabitForm } from "@/components/HabitForm";
import { Heatmap } from "@/components/Heatmap";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/context/HabitsContext";
import { frequencyLabel, isDone, isScheduledOn, toKey, WEEKDAY_SHORT, weekCount } from "@/lib/habit-logic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/habits/$id")({
  head: () => ({
    meta: [
      { title: "Habit details — Daily Bloom" },
      { name: "description", content: "Streaks, 30-day completion rate, calendar and notes for one habit." },
      { property: "og:title", content: "Habit details — Daily Bloom" },
      { property: "og:description", content: "Streaks, 30-day completion rate, calendar and notes for one habit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HabitDetail,
});

function HabitDetail() {
  const { id } = Route.useParams();
  const { habits, completions, today, statsFor, categoryName, routineName, loaded } = useHabits();
  const [month, setMonth] = useState(today);
  const [editOpen, setEditOpen] = useState(false);
  const habit = habits.find((h) => h.id === id);
  if (!loaded) return null;
  if (!habit) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-muted-foreground">This habit doesn't exist anymore.</p>
        <Button asChild><Link to="/habits">Back to habits</Link></Button>
      </div>
    );
  }
  const s = statsFor(habit);
  const unit = s.streakUnit === "weeks" ? "weeks" : "days";
  const history = Array.from({ length: 30 }, (_, i) => subDays(today, i)).filter((d) => isScheduledOn(habit, d));

  return (
    <div>
      <Link to="/habits" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Habits
      </Link>
      <div className="mb-6 flex items-center gap-4">
        <HabitBadge icon={habit.icon} color={habit.color} className="size-16 text-4xl" />
        <div className="flex-1">
          <PageHeader
            title={habit.name}
            subtitle={`${frequencyLabel(habit.frequency)} · ${categoryName(habit.categoryId)} · ${routineName(habit.routineId)}${habit.reminder ? ` · ${habit.reminder}` : ""}`}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit habit"><Pencil /></Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatTile label="Current" value={`🔥 ${s.currentStreak}`} sub={unit} />
        <StatTile label="Longest" value={s.longestStreak} sub={unit} />
        <StatTile label="30 days" value={`${Math.round(s.rate30 * 100)}%`} sub="completion" />
      </div>

      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-3 text-sm font-semibold">By weekday (last 8 weeks)</div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const r = s.weekdayRates[d] ?? null;
            return (
              <div key={d}>
                <div className="mb-1 flex h-16 items-end justify-center rounded-lg bg-muted">
                  {r !== null && <div className="w-full rounded-lg bg-primary" style={{ height: `${Math.max(6, r * 100)}%` }} />}
                </div>
                <div className="text-muted-foreground">{WEEKDAY_SHORT[d]}</div>
                <div className="font-semibold">{r === null ? "–" : `${Math.round(r * 100)}%`}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <Heatmap
          month={month}
          onMonthChange={setMonth}
          today={today}
          valueFor={(d) => {
            if (!isScheduledOn(habit, d)) return null;
            if (habit.frequency.type === "weekly") {
              const n = weekCount(completions, habit.id, d);
              return isDone(completions, habit.id, toKey(d)) ? 1 : n >= habit.frequency.times ? null : 0;
            }
            return isDone(completions, habit.id, toKey(d)) ? 1 : 0;
          }}
        />
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Last 30 days</h2>
      <ul className="divide-y rounded-2xl border bg-card shadow-card">
        {history.map((d) => {
          const c = completions[`${habit.id}|${toKey(d)}`];
          return (
            <li key={toKey(d)} className="flex items-start gap-3 p-3">
              <span className={cn("mt-0.5 flex size-6 items-center justify-center rounded-full", c ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                {c ? <Check className="size-4" /> : <X className="size-3.5" />}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">{format(d, "EEE, MMM d")}</div>
                {c?.note && <div className="text-sm italic text-muted-foreground">"{c.note}"</div>}
              </div>
            </li>
          );
        })}
      </ul>
      <HabitForm open={editOpen} onOpenChange={setEditOpen} habit={habit} />
    </div>
  );
}
