import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { addDays, format, isSameDay } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Celebration } from "@/components/Celebration";
import { applyFilters, FilterBar } from "@/components/FilterBar";
import { ProgressRing } from "@/components/habit-ui";
import { HabitCheckItem } from "@/components/HabitCheckItem";
import { HabitForm } from "@/components/HabitForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHabits } from "@/context/HabitsContext";
import { dueHabits, fromKey, isDone, shouldCelebrate, toKey } from "@/lib/habit-logic";
import type { Filters, Habit } from "@/types/habit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Daily Bloom" },
      { name: "description", content: "Check off today's habits, see your progress and keep your streaks alive." },
      { property: "og:title", content: "Today — Daily Bloom" },
      { property: "og:description", content: "Check off today's habits, see your progress and keep your streaks alive." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { date?: string | undefined } =>
    typeof s.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? { date: s.date } : {},
  component: Today,
});

function Today() {
  const { activeHabits, completions, today, loaded, categories, routines, celebrated, markCelebrated } = useHabits();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const parsed = search.date ? fromKey(search.date) : today;
  const date = parsed > today ? today : parsed;
  const setDate = (d: Date) => navigate({ search: isSameDay(d, today) ? {} : { date: toKey(d) } });
  const [groupBy, setGroupBy] = useState<"routine" | "category">("routine");
  const [filters, setFilters] = useState<Filters>({ categoryId: "all", routineId: "all" });
  const [formOpen, setFormOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

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
        ? [...[...routines].sort((a, b) => a.order - b.order).map((r) => ({ id: r.id as string | null, name: r.name })), { id: null, name: "Anytime" }]
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
        <div className="flex flex-col items-center text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">{isToday ? "Today" : format(date, "EEEE")}</div>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="flex items-center gap-2 rounded-xl px-2 py-1 text-2xl font-bold hover:bg-accent" aria-label="Pick a date">
                {format(date, "MMMM d")}{date.getFullYear() !== today.getFullYear() ? `, ${date.getFullYear()}` : ""}
                <CalendarIcon className="size-5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { if (d) { setDate(d); setPickerOpen(false); } }}
                disabled={(d) => d > today}
                defaultMonth={date}
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>
          {!isToday && (
            <Button variant="secondary" size="sm" className="mt-1 h-8 rounded-full" onClick={() => setDate(today)}>
              <RotateCcw className="size-3.5" /> Back to today
            </Button>
          )}
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
