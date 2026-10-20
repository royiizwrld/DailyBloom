import { addDays, differenceInCalendarDays } from "date-fns";
import type { HabitData } from "@/types/habit";
import { dueHabits, goalProgress, frequencyLabel, fromKey, habitStats, isDone, toKey, WEEKDAY_SHORT, weekStart } from "./habit-logic";

/** Compact, number-only summary of the user's data sent to the coach. */
export function buildCoachSummary(data: HabitData, today: Date) {
  const active = data.habits.filter((h) => !h.archived);
  const pct = (v: number | null) => (v === null ? null : Math.round(v * 100));
  const habits = active.map((h) => {
    const s = habitStats(h, data.completions, today);
    const notes = Object.values(data.completions)
      .filter((c) => c.habitId === h.id && c.note)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map((c) => `${c.date}: ${c.note}`);
    return {
      id: h.id,
      name: h.name,
      category: data.categories.find((c) => c.id === h.categoryId)?.name ?? "Other",
      routineId: h.routineId,
      frequency: frequencyLabel(h.frequency),
      daysTracked: differenceInCalendarDays(today, fromKey(h.createdAt)) + 1,
      currentStreak: `${s.currentStreak} ${s.streakUnit}`,
      longestStreak: `${s.longestStreak} ${s.streakUnit}`,
      completion30dPct: pct(s.rate30),
      byWeekdayPct: Object.fromEntries(WEEKDAY_SHORT.map((d, i) => [d, pct(s.weekdayRates[i] ?? null)])),
      recentNotes: notes,
    };
  });
  const weeklyTrend: { weekOf: string; completionPct: number | null; due: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const ws = addDays(weekStart(today), -7 * w);
    let due = 0;
    let done = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      if (differenceInCalendarDays(d, today) > 0) break;
      const k = toKey(d);
      for (const h of dueHabits(active, d, data.completions)) {
        const ok = isDone(data.completions, h.id, k);
        if (k === toKey(today) && !ok) continue;
        due++;
        if (ok) done++;
      }
    }
    weeklyTrend.push({ weekOf: toKey(ws), completionPct: due ? Math.round((done / due) * 100) : null, due });
  }
  const loadByWeekday = WEEKDAY_SHORT.map((d, i) => {
    const date = addDays(weekStart(today), (i + 6) % 7);
    return { day: d, habitsScheduled: active.filter((h) => h.frequency.type !== "weekly" && (h.frequency.type === "daily" || h.frequency.days.includes(i))).length, sample: toKey(date) };
  }).map(({ day, habitsScheduled }) => ({ day, habitsScheduled }));
  return {
    today: toKey(today),
    routines: data.routines.map((r) => ({ id: r.id, name: r.name })),
    habits,
    weeklyTrend,
    fixedHabitsPerWeekday: loadByWeekday,
    goals: (data.goals ?? []).map((g) => {
      const p = goalProgress(g, data.completions, today);
      return { name: g.name, habitId: g.habitId, startDate: g.startDate, deadline: g.deadline ?? null, checkIns: p.done, target: p.target, complete: p.complete, expired: p.expired, daysLeft: p.daysLeft };
    }),
  };
}
