import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import type { Category, Completion, Frequency, Goal, Habit, HabitColor, HabitData, Routine } from "@/types/habit";
import { completionKey } from "./habit-logic";
import { DEFAULT_CATEGORIES, DEFAULT_ROUTINES } from "./seed";

type DB = SupabaseClient<Database>;
type HabitRow = Database["public"]["Tables"]["habits"]["Row"];

export const habitToRow = (h: Habit, user_id: string) => ({
  user_id,
  id: h.id,
  name: h.name,
  icon: h.icon,
  color: h.color,
  category_id: h.categoryId,
  routine_id: h.routineId,
  frequency: h.frequency as unknown as Json,
  reminder: h.reminder ?? null,
  archived: h.archived,
  created_on: h.createdAt,
});

export const rowToHabit = (r: HabitRow): Habit => ({
  id: r.id,
  name: r.name,
  icon: r.icon,
  color: r.color as HabitColor,
  categoryId: r.category_id,
  routineId: r.routine_id,
  frequency: r.frequency as unknown as Frequency,
  reminder: r.reminder ?? undefined,
  archived: r.archived,
  createdAt: r.created_on,
});

export const goalToRow = (g: Goal, user_id: string) => ({
  user_id, id: g.id, name: g.name, habit_id: g.habitId, target: g.target, start_date: g.startDate, deadline: g.deadline ?? null,
});

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Loads all of one user's data. RLS limits every query to the signed-in user. */
export async function loadUserData(db: DB): Promise<HabitData> {
  const [h, c, r, comp, g, cel] = await Promise.all([
    db.from("habits").select("*").order("created_at"),
    db.from("categories").select("*").order("created_at"),
    db.from("routines").select("*").order("sort_order"),
    db.from("completions").select("habit_id, day, note").limit(20000),
    db.from("goals").select("*"),
    db.from("celebrations").select("day"),
  ]);
  const categories: Category[] = must(c).map((x) => ({ id: x.id, name: x.name, builtIn: x.built_in }));
  const routines: Routine[] = must(r).map((x) => ({ id: x.id, name: x.name, order: x.sort_order }));
  const completions: Record<string, Completion> = {};
  for (const x of must(comp)) completions[completionKey(x.habit_id, x.day)] = { habitId: x.habit_id, date: x.day, note: x.note ?? undefined };
  return {
    habits: must(h).map(rowToHabit),
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    routines: routines.length ? routines : DEFAULT_ROUTINES,
    completions,
    goals: must(g).map((x) => ({ id: x.id, name: x.name, habitId: x.habit_id, target: x.target, startDate: x.start_date, deadline: x.deadline ?? undefined })),
    celebrated: must(cel).map((x) => x.day),
  };
}

/** Uploads a whole local data set (one-time import). Upserts so it is safe to retry. */
export async function importData(db: DB, user_id: string, d: HabitData) {
  const habits = d.habits.filter((h) => !h.sample);
  const ids = new Set(habits.map((h) => h.id));
  const ops = [
    db.from("categories").upsert(d.categories.map((c) => ({ user_id, id: c.id, name: c.name, built_in: !!c.builtIn }))),
    db.from("routines").upsert(d.routines.map((r) => ({ user_id, id: r.id, name: r.name, sort_order: r.order }))),
    db.from("habits").upsert(habits.map((h) => habitToRow(h, user_id))),
  ];
  for (const res of await Promise.all(ops)) must(res);
  const comps = Object.values(d.completions).filter((c) => ids.has(c.habitId)).map((c) => ({ user_id, habit_id: c.habitId, day: c.date, note: c.note ?? null }));
  for (let i = 0; i < comps.length; i += 500) must(await db.from("completions").upsert(comps.slice(i, i + 500)));
  const goals = (d.goals ?? []).filter((g) => ids.has(g.habitId)).map((g) => goalToRow(g, user_id));
  if (goals.length) must(await db.from("goals").upsert(goals));
  if (d.celebrated.length) must(await db.from("celebrations").upsert(d.celebrated.map((day) => ({ user_id, day }))));
}

/** Today's yyyy-MM-dd in the given IANA timezone, as a local Date at midnight. */
export function todayInZone(tz: string, now = new Date()): Date {
  try {
    const s = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y!, m! - 1, d!);
  } catch {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
