import { createFileRoute } from "@tanstack/react-router";
import { eachDayOfInterval, endOfMonth, isAfter, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { applyFilters, FilterBar } from "@/components/FilterBar";
import { PageHeader, StatTile } from "@/components/habit-ui";
import { Heatmap } from "@/components/Heatmap";
import { useHabits } from "@/context/HabitsContext";
import { dayRate } from "@/lib/habit-logic";
import type { Filters } from "@/types/habit";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Daily Habit Tracker" },
      { name: "description", content: "A monthly heatmap of how many of your due habits you completed each day." },
      { property: "og:title", content: "History — Daily Habit Tracker" },
      { property: "og:description", content: "A monthly heatmap of how many of your due habits you completed each day." },
    ],
  }),
  component: History,
});

function History() {
  const { activeHabits, completions, today } = useHabits();
  const [month, setMonth] = useState(today);
  const [filters, setFilters] = useState<Filters>({ categoryId: "all", routineId: "all" });
  const habits = applyFilters(activeHabits, filters);

  const summary = useMemo(() => {
    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).filter((d) => !isAfter(d, today));
    const rates = days.map((d) => dayRate(habits, d, completions)).filter((r): r is number => r !== null);
    return {
      avg: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0,
      perfect: rates.filter((r) => r === 1).length,
      tracked: rates.length,
    };
  }, [month, habits, completions, today]);

  return (
    <div>
      <PageHeader title="History" subtitle="Share of due habits completed each day" />
      <div className="mb-4"><FilterBar value={filters} onChange={setFilters} /></div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Average" value={`${Math.round(summary.avg * 100)}%`} />
        <StatTile label="Perfect days" value={summary.perfect} />
        <StatTile label="Days tracked" value={summary.tracked} />
      </div>
      <Heatmap month={month} onMonthChange={setMonth} today={today} valueFor={(d) => dayRate(habits, d, completions)} />
    </div>
  );
}
