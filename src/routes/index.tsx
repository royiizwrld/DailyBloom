import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Celebration } from "@/components/Celebration";
import { applyFilters, FilterBar } from "@/components/FilterBar";
import { ProgressRing } from "@/components/habit-ui";
import { HabitCheckItem } from "@/components/HabitCheckItem";
import { HabitForm } from "@/components/HabitForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHabits } from "@/context/HabitsContext";
import { dueHabits, isDone, shouldCelebrate, toKey } from "@/lib/habit-logic";
import type { Filters, Habit } from "@/types/habit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Daily Habit Tracker" },
      { name: "description", content: "Check off today's habits, see your progress and keep your streaks alive." },
      { property: "og:title", content: "Today — Daily Habit Tracker" },
      { property: "og:description", content: "Check off today's habits, see your progress and keep your streaks alive." },
    ],
  }),
  component: Today,
});

function Today() {
  const { activeHabits, completions, today, loaded, categories, routines, celebrated, markCelebrated } = useHabits();
  const [date, setDate] = useState(today);
  const [groupBy, setGroupBy] = useState<"routine" | "category">("routine");
  const [filters, setFilters] = useState<Filters>({ categoryId: "all", routineId: "all" });
  const [formOpen, setFormOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => setDate(today), [today]);
  const key = toKey(date);
  const isToday = isSameDay(date, today);
  const due = useMemo(() => dueHabits(activeHabits, date, completions), [activeHabits, date, completions]);
  const doneCount = due.filter((h) => isDone(completions, h.id, key)).length;
  const shown = applyFilters(due, filters);

  useEffect(() => {
    if (loaded && isToday && shouldCelebrate(due.length, doneCount, key, celebrated)) {
      markCelebrated(key);
      setCelebrate(true);
    }
  }, [loaded, isToday, due.length, doneCount, key, celebrated, markCelebrated]);
  const close = useCallback(() => setCelebrate(false), []);

  const groups = useMemo(() => {
    const defs =
      groupBy === "routine"
        ? [...routines.sort((a, b) => a.order - b.order).map((r) => ({ id: r.id as string | null, name: r.name })), { id: null, name: "Anytime" }]
        : categories.map((c) => ({ id: c.id as string | null, name: c.name }));
    return defs
      .map((g) => ({ ...g, items: shown.filter((h: Habit) => (groupBy === "routine" ? h.routineId === g.id : h.categoryId === g.id)) }))
      .filter((g) => g.items.length);
  }, [groupBy, routines, categories, shown]);

  return (
    <div>
      <Celebration show={celebrate} onClose={close} />
      <div className="mb-5 flex items-center justify-between">
        <Button variant="outline" size="icon" className="size-11 rounded-full" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
          <ChevronLeft />
        </Button>
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">{isToday ? "Today" : format(date, "EEEE")}</div>
          <h1 className="text-2xl font-bold">{format(date, "MMMM d")}</h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-11 rounded-full"
          disabled={isToday}
          onClick={() => setDate(addDays(date, 1))}
          aria-label="Next day"
        >
          <ChevronRight />
        </Button>
      </div>

      <section className="mb-6 flex items-center gap-5 rounded-3xl border bg-card p-5 shadow-card">
        <ProgressRing value={due.length ? doneCount / due.length : 0}>
          <span className="font-display text-xl font-bold">{doneCount}/{due.length}</span>
        </ProgressRing>
        <div className="flex-1">
          <div className="font-display text-lg font-semibold">
            {due.length === 0 ? "Nothing due" : doneCount === due.length ? "Everything done 🎉" : `${due.length - doneCount} to go`}
          </div>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {due.length} habits done{isToday ? " today" : ""}.
          </p>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as "routine" | "category")}>
          <TabsList className="h-10 rounded-full">
            <TabsTrigger value="routine" className="rounded-full px-4">By routine</TabsTrigger>
            <TabsTrigger value="category" className="rounded-full px-4">By category</TabsTrigger>
          </TabsList>
        </Tabs>
        <FilterBar value={filters} onChange={setFilters} />
      </div>

      {!loaded ? null : activeHabits.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-10 text-center">
          <p className="mb-4 text-muted-foreground">No habits yet. Start small — one habit is plenty.</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setFormOpen(true)}><Plus /> Add a habit</Button>
            <Button variant="outline" asChild><Link to="/habits">Bulk add</Link></Button>
          </div>
        </div>
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No habits due{filters.categoryId !== "all" || filters.routineId !== "all" ? " for this filter" : ""}.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.id ?? "none"}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{g.name}</h2>
              <div className="space-y-2">
                {g.items.map((h) => <HabitCheckItem key={h.id} habit={h} date={key} dateObj={date} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      <Button onClick={() => setFormOpen(true)} variant="secondary" className="mt-6 h-12 w-full rounded-2xl">
        <Plus /> New habit
      </Button>
      <HabitForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
