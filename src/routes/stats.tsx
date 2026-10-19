import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HabitBadge, PageHeader, StatTile } from "@/components/habit-ui";
import { useHabits } from "@/context/HabitsContext";
import { dueHabits, isDone, toKey, WEEKDAY_SHORT, weekStart } from "@/lib/habit-logic";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats — Daily Bloom" },
      { name: "description", content: "Weekly completion trends, category rates, best weekdays and a streak leaderboard." },
      { property: "og:title", content: "Stats — Daily Bloom" },
      { property: "og:description", content: "Weekly completion trends, category rates, best weekdays and a streak leaderboard." },
    ],
  }),
  component: Stats,
});

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" };

function Stats() {
  const { activeHabits, completions, today, categories, statsFor } = useHabits();

  const data = useMemo(() => {
    const byDay: { date: Date; due: number; done: number; cats: Record<string, [number, number]> }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = addDays(today, -i);
      const k = toKey(d);
      const due = dueHabits(activeHabits, d, completions);
      const cats: Record<string, [number, number]> = {};
      let done = 0;
      for (const h of due) {
        const ok = isDone(completions, h.id, k) ? 1 : 0;
        if (i === 0 && !ok) continue;
        done += ok;
        cats[h.categoryId] = [(cats[h.categoryId]?.[0] ?? 0) + ok, (cats[h.categoryId]?.[1] ?? 0) + 1];
      }
      byDay.push({ date: d, due: i === 0 ? done + 0 : due.length, done, cats });
    }
    // weekly line
    const weeks = new Map<string, { done: number; due: number }>();
    for (const b of byDay) {
      const wk = toKey(weekStart(b.date));
      const w = weeks.get(wk) ?? { done: 0, due: 0 };
      w.done += b.done; w.due += b.due;
      weeks.set(wk, w);
    }
    const weekly = [...weeks.entries()].slice(-12).filter(([, w]) => w.due > 0).map(([k, w]) => ({
      week: format(new Date(k + "T00:00"), "MMM d"),
      rate: w.due ? Math.round((w.done / w.due) * 100) : 0,
    }));
    const last30 = byDay.slice(-30);
    const cat = categories
      .map((c) => {
        const [done, due] = last30.reduce(([a, b], d) => [a + (d.cats[c.id]?.[0] ?? 0), b + (d.cats[c.id]?.[1] ?? 0)], [0, 0]);
        return { name: c.name, rate: due ? Math.round((done / due) * 100) : null };
      })
      .filter((c) => c.rate !== null) as { name: string; rate: number }[];
    const wd = Array.from({ length: 7 }, () => ({ done: 0, due: 0 }));
    for (const b of byDay.slice(-56)) { const w = wd[b.date.getDay()]!; w.done += b.done; w.due += b.due; }
    const wdRates = wd.map((w, i) => ({ day: WEEKDAY_SHORT[i], rate: w.due ? w.done / w.due : null })).filter((w) => w.rate !== null) as { day: string; rate: number }[];
    const sorted = [...wdRates].sort((a, b) => b.rate - a.rate);
    return { weekly, cat, best: sorted[0], worst: sorted[sorted.length - 1] };
  }, [activeHabits, completions, today, categories]);

  const board = activeHabits.map((h) => ({ h, s: statsFor(h) })).sort((a, b) => b.s.currentStreak - a.s.currentStreak);

  return (
    <div className="space-y-6">
      <PageHeader title="Stats" subtitle="How your habits are trending" />
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Best day" value={data.best?.day ?? "–"} sub={data.best ? `${Math.round(data.best.rate * 100)}% done` : "Not enough data"} />
        <StatTile label="Toughest day" value={data.worst?.day ?? "–"} sub={data.worst ? `${Math.round(data.worst.rate * 100)}% done` : "Not enough data"} />
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-semibold">Weekly completion · last 12 weeks</h2>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={data.weekly} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Completion"]} />
              <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: "var(--primary)" }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-semibold">By category · last 30 days</h2>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={data.cat} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} formatter={(v) => [`${v}%`, "Completion"]} />
              <Bar dataKey="rate" fill="var(--chart-2)" radius={[8, 8, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Streak leaderboard</h2>
        <ol className="space-y-2">
          {board.map(({ h, s }, i) => (
            <li key={h.id}>
              <Link to="/habits/$id" params={{ id: h.id }} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
                <span className="w-6 text-center font-display font-bold text-muted-foreground">{i + 1}</span>
                <HabitBadge icon={h.icon} color={h.color} />
                <span className="flex-1 truncate font-medium">{h.name}</span>
                <span className="font-display font-bold">🔥 {s.currentStreak}<span className="ml-1 text-xs font-normal text-muted-foreground">{s.streakUnit === "weeks" ? "wk" : "d"}</span></span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
