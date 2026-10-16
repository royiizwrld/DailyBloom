import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Category, Habit, HabitData, HabitStats, Routine } from "@/types/habit";
import { completionKey, habitStats } from "@/lib/habit-logic";
import { buildSeed, emptyData } from "@/lib/seed";

const STORAGE_KEY = "habit-tracker:v1";

const uid = () => Math.random().toString(36).slice(2, 10);

interface Ctx extends HabitData {
  loaded: boolean;
  today: Date;
  activeHabits: Habit[];
  hasSample: boolean;
  addHabit: (h: Omit<Habit, "id" | "createdAt" | "archived">) => Habit;
  addHabits: (hs: Omit<Habit, "id" | "createdAt" | "archived">[]) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggle: (habitId: string, date: string) => void;
  setNote: (habitId: string, date: string, note: string) => void;
  addCategory: (name: string) => Category;
  deleteCategory: (id: string) => void;
  addRoutine: (name: string) => Routine;
  deleteRoutine: (id: string) => void;
  markCelebrated: (date: string) => void;
  clearSample: () => void;
  statsFor: (h: Habit) => HabitStats;
  categoryName: (id: string) => string;
  routineName: (id: string | null) => string;
}

const HabitsContext = createContext<Ctx | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<HabitData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setData(raw ? { ...emptyData(), ...JSON.parse(raw) } : buildSeed(new Date()));
    } catch {
      setData(buildSeed(new Date()));
    }
    setToday(new Date());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const todayKey = today.toDateString();
  const update = useCallback((fn: (d: HabitData) => HabitData) => setData(fn), []);

  const value = useMemo<Ctx>(() => {
    const make = (h: Omit<Habit, "id" | "createdAt" | "archived">): Habit => ({
      ...h, id: uid(), archived: false, createdAt: new Date().toISOString().slice(0, 10),
    });
    // createdAt uses local date
    const localKey = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    return {
      ...data,
      loaded,
      today,
      activeHabits: data.habits.filter((h) => !h.archived),
      hasSample: data.habits.some((h) => h.sample),
      addHabit: (h) => {
        const nh = { ...make(h), createdAt: localKey() };
        update((d) => ({ ...d, habits: [...d.habits, nh] }));
        return nh;
      },
      addHabits: (hs) => {
        const list = hs.map((h) => ({ ...make(h), createdAt: localKey() }));
        update((d) => ({ ...d, habits: [...d.habits, ...list] }));
      },
      updateHabit: (id, patch) =>
        update((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHabit: (id) =>
        update((d) => ({
          ...d,
          habits: d.habits.filter((h) => h.id !== id),
          completions: Object.fromEntries(Object.entries(d.completions).filter(([, c]) => c.habitId !== id)),
        })),
      toggle: (habitId, date) =>
        update((d) => {
          const k = completionKey(habitId, date);
          const completions = { ...d.completions };
          if (completions[k]) delete completions[k];
          else completions[k] = { habitId, date };
          return { ...d, completions };
        }),
      setNote: (habitId, date, note) =>
        update((d) => {
          const k = completionKey(habitId, date);
          const existing = d.completions[k] ?? { habitId, date };
          return { ...d, completions: { ...d.completions, [k]: { ...existing, note: note.trim() || undefined } } };
        }),
      addCategory: (name) => {
        const c = { id: uid(), name: name.trim() };
        update((d) => ({ ...d, categories: [...d.categories, c] }));
        return c;
      },
      deleteCategory: (id) =>
        update((d) => ({
          ...d,
          categories: d.categories.filter((c) => c.id !== id),
          habits: d.habits.map((h) => (h.categoryId === id ? { ...h, categoryId: "other" } : h)),
        })),
      addRoutine: (name) => {
        const r = { id: uid(), name: name.trim(), order: data.routines.length };
        update((d) => ({ ...d, routines: [...d.routines, r] }));
        return r;
      },
      deleteRoutine: (id) =>
        update((d) => ({
          ...d,
          routines: d.routines.filter((r) => r.id !== id),
          habits: d.habits.map((h) => (h.routineId === id ? { ...h, routineId: null } : h)),
        })),
      markCelebrated: (date) =>
        update((d) => (d.celebrated.includes(date) ? d : { ...d, celebrated: [...d.celebrated, date] })),
      clearSample: () =>
        update((d) => {
          const ids = new Set(d.habits.filter((h) => h.sample).map((h) => h.id));
          return {
            ...d,
            habits: d.habits.filter((h) => !ids.has(h.id)),
            completions: Object.fromEntries(Object.entries(d.completions).filter(([, c]) => !ids.has(c.habitId))),
            celebrated: [],
          };
        }),
      statsFor: (h) => habitStats(h, data.completions, today),
      categoryName: (id) => data.categories.find((c) => c.id === id)?.name ?? "Other",
      routineName: (id) => data.routines.find((r) => r.id === id)?.name ?? "Anytime",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loaded, todayKey, update]);

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used inside HabitsProvider");
  return ctx;
}
