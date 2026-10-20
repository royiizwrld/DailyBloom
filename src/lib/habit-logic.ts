import { addDays, format, parseISO, startOfWeek, differenceInCalendarDays } from "date-fns";
import type { Completion, Frequency, Habit, HabitStats } from "@/types/habit";

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const toKey = (d: Date) => format(d, "yyyy-MM-dd");
export const fromKey = (k: string) => parseISO(k);
export const completionKey = (habitId: string, date: string) => `${habitId}|${date}`;
export const weekStart = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

export type CompletionMap = Record<string, Completion>;

export function isDone(c: CompletionMap, habitId: string, date: string) {
  return !!c[completionKey(habitId, date)];
}

export function frequencyLabel(f: Frequency): string {
  if (f.type === "daily") return "Every day";
  if (f.type === "weekly") return `${f.times}× per week`;
  const days = [...f.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Weekdays";
  return days.map((d) => WEEKDAY_SHORT[d]).join("/");
}

/** Whether a fixed-schedule habit is scheduled on a date (weekly habits: any day counts). */
export function isScheduledOn(habit: Habit, date: Date): boolean {
  if (differenceInCalendarDays(date, fromKey(habit.createdAt)) < 0) return false;
  const f = habit.frequency;
  if (f.type === "weekdays") return f.days.includes(date.getDay());
  return true;
}

/** Completions in the Mon–Sun week containing `date`. Optionally exclude one date. */
export function weekCount(c: CompletionMap, habitId: string, date: Date, excludeDate?: string): number {
  const ws = weekStart(date);
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const k = toKey(addDays(ws, i));
    if (k !== excludeDate && isDone(c, habitId, k)) n++;
  }
  return n;
}

/** Whether the habit should appear on the checklist for this date. */
export function isDueOn(habit: Habit, date: Date, c: CompletionMap): boolean {
  if (habit.archived) return false;
  if (!isScheduledOn(habit, date)) return false;
  const f = habit.frequency;
  if (f.type !== "weekly") return true;
  const key = toKey(date);
  if (isDone(c, habit.id, key)) return true;
  return weekCount(c, habit.id, date, key) < f.times;
}

export function dueHabits(habits: Habit[], date: Date, c: CompletionMap) {
  return habits.filter((h) => isDueOn(h, date, c));
}

/** Fraction of due habits done on a date; null when nothing was due. */
export function dayRate(habits: Habit[], date: Date, c: CompletionMap): number | null {
  const due = dueHabits(habits, date, c);
  if (due.length === 0) return null;
  const key = toKey(date);
  return due.filter((h) => isDone(c, h.id, key)).length / due.length;
}

function scheduledDaysUntil(habit: Habit, today: Date): Date[] {
  const start = fromKey(habit.createdAt);
  const out: Date[] = [];
  for (let d = start; differenceInCalendarDays(today, d) >= 0; d = addDays(d, 1)) {
    if (isScheduledOn(habit, d)) out.push(d);
  }
  return out;
}

export function computeStreaks(habit: Habit, c: CompletionMap, today: Date) {
  const todayKey = toKey(today);
  if (habit.frequency.type === "weekly") {
    const target = habit.frequency.times;
    const weeks: { met: boolean; current: boolean }[] = [];
    const curWs = weekStart(today);
    for (let ws = weekStart(fromKey(habit.createdAt)); differenceInCalendarDays(curWs, ws) >= 0; ws = addDays(ws, 7)) {
      weeks.push({ met: weekCount(c, habit.id, ws) >= target, current: toKey(ws) === toKey(curWs) });
    }
    let longest = 0;
    let run = 0;
    for (const w of weeks) {
      run = w.met ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    let current = 0;
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i]!.met) current++;
      else if (weeks[i]!.current) continue; // week still in progress
      else break;
    }
    return { current, longest, unit: "weeks" as const };
  }
  const days = scheduledDaysUntil(habit, today);
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = isDone(c, habit.id, toKey(d)) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const k = toKey(days[i]!);
    if (isDone(c, habit.id, k)) current++;
    else if (k === todayKey) continue; // today not done yet doesn't break
    else break;
  }
  return { current, longest, unit: "days" as const };
}

export function completionRate(habit: Habit, c: CompletionMap, today: Date, days = 30): number {
  const start = addDays(today, -(days - 1));
  if (habit.frequency.type === "weekly") {
    const target = habit.frequency.times;
    let got = 0;
    let want = 0;
    for (let ws = weekStart(start); differenceInCalendarDays(today, ws) >= 0; ws = addDays(ws, 7)) {
      if (differenceInCalendarDays(addDays(ws, 6), fromKey(habit.createdAt)) < 0) continue;
      const isCurrent = toKey(ws) === toKey(weekStart(today));
      const n = weekCount(c, habit.id, ws);
      if (isCurrent && n < target) continue; // don't penalise an in-progress week
      got += Math.min(n, target);
      want += target;
    }
    return want ? got / want : 0;
  }
  let got = 0;
  let want = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    if (!isScheduledOn(habit, d)) continue;
    const k = toKey(d);
    const done = isDone(c, habit.id, k);
    if (k === toKey(today) && !done) continue;
    want++;
    if (done) got++;
  }
  return want ? got / want : 0;
}

export function weekdayRates(habit: Habit, c: CompletionMap, today: Date, days = 56): (number | null)[] {
  const got = Array(7).fill(0);
  const want = Array(7).fill(0);
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (!isScheduledOn(habit, d)) continue;
    const wd = d.getDay();
    const done = isDone(c, habit.id, toKey(d));
    if (i === 0 && !done) continue;
    want[wd]++;
    if (done) got[wd]++;
  }
  return want.map((w, i) => (w ? got[i] / w : null));
}

export function habitStats(habit: Habit, c: CompletionMap, today: Date): HabitStats {
  const s = computeStreaks(habit, c, today);
  return {
    currentStreak: s.current,
    longestStreak: s.longest,
    streakUnit: s.unit,
    rate30: completionRate(habit, c, today),
    weekdayRates: weekdayRates(habit, c, today),
  };
}

/** Confetti fires only once per date, and only when every due habit is done. */
export function shouldCelebrate(dueCount: number, doneCount: number, date: string, celebrated: string[]) {
  return dueCount > 0 && doneCount >= dueCount && !celebrated.includes(date);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
export function findDuplicate(name: string, habits: Habit[]): Habit | undefined {
  const n = norm(name);
  if (!n) return undefined;
  return habits.find((h) => {
    const m = norm(h.name);
    return m === n || (m.length > 3 && n.includes(m)) || (n.length > 3 && m.includes(n));
  });
}

/** Goal progress: check-ins of the goal's habit from startDate through deadline (or today). */
export function goalProgress(
  goal: { habitId: string; target: number; startDate: string; deadline?: string | undefined },
  completions: Record<string, { habitId: string; date: string }>,
  today: Date,
) {
  const todayKey = toKey(today);
  const end = goal.deadline && goal.deadline < todayKey ? goal.deadline : todayKey;
  const done = Object.values(completions).filter((c) => c.habitId === goal.habitId && c.date >= goal.startDate && c.date <= end).length;
  const complete = done >= goal.target;
  const expired = !complete && !!goal.deadline && goal.deadline < todayKey;
  const daysLeft = goal.deadline ? Math.max(0, Math.round((fromKey(goal.deadline).getTime() - fromKey(todayKey).getTime()) / 86400000)) : null;
  return { done, target: goal.target, pct: Math.min(1, done / Math.max(1, goal.target)), complete, expired, daysLeft };
}
