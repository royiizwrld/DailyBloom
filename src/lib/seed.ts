import { addDays } from "date-fns";
import type { Category, Completion, Habit, HabitData, Routine } from "@/types/habit";
import { completionKey, isScheduledOn, toKey } from "./habit-logic";

export const DEFAULT_CATEGORIES: Category[] = [
  "Health", "Fitness", "Coding", "Reading", "Learning", "Mindfulness", "Social", "Other",
].map((name) => ({ id: name.toLowerCase(), name, builtIn: true }));

export const DEFAULT_ROUTINES: Routine[] = [
  { id: "morning", name: "Morning", order: 0 },
  { id: "afternoon", name: "Afternoon", order: 1 },
  { id: "evening", name: "Evening", order: 2 },
];

export function emptyData(): HabitData {
  return { habits: [], categories: DEFAULT_CATEGORIES, routines: DEFAULT_ROUTINES, completions: {}, celebrated: [], goals: [] };
}

/** Builds demo habits with ~6 weeks of deterministic history. Call lazily (never at module scope). */
export function buildSeed(today: Date): HabitData {
  const created = toKey(addDays(today, -42));
  const mk = (id: string, name: string, icon: string, color: Habit["color"], categoryId: string, routineId: string, frequency: Habit["frequency"]): Habit => ({
    id, name, icon, color, categoryId, routineId, frequency, archived: false, createdAt: created, sample: true,
  });
  const habits: Habit[] = [
    mk("s-water", "Drink a glass of water", "💧", "sky", "health", "morning", { type: "daily" }),
    mk("s-stretch", "Stretch 10 min", "🧘", "teal", "fitness", "morning", { type: "daily" }),
    mk("s-gym", "Gym session", "🏋️", "coral", "fitness", "afternoon", { type: "weekdays", days: [1, 3, 5] }),
    mk("s-code", "Code for 1 hour", "💻", "violet", "coding", "afternoon", { type: "weekdays", days: [1, 2, 3, 4, 5] }),
    mk("s-read", "Read 10 pages", "📚", "amber", "reading", "evening", { type: "daily" }),
    mk("s-call", "Call a friend", "📞", "rose", "social", "evening", { type: "weekly", times: 2 }),
  ];
  const skill: Record<string, number> = { "s-water": 0.9, "s-stretch": 0.7, "s-gym": 0.6, "s-code": 0.8, "s-read": 0.65, "s-call": 0.35 };
  const completions: Record<string, Completion> = {};
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 42; i >= 1; i--) {
    const d = addDays(today, -i);
    for (const h of habits) {
      if (!isScheduledOn(h, d)) continue;
      let p = skill[h.id] ?? 0.5;
      if (h.id === "s-gym" && d.getDay() === 5) p = 0.25; // Fridays are hard
      if (rnd() < p) {
        const date = toKey(d);
        completions[completionKey(h.id, date)] = {
          habitId: h.id, date,
          note: h.id === "s-gym" && rnd() < 0.2 ? "Felt tired, did a short version" : undefined,
        };
      }
    }
  }
  return { habits, categories: DEFAULT_CATEGORIES, routines: DEFAULT_ROUTINES, completions, celebrated: [] };
}
