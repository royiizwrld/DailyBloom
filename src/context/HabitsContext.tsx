import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Category, Goal, Habit, HabitData, HabitStats, Routine } from "@/types/habit";
import { completionKey, habitStats, toKey } from "@/lib/habit-logic";
import { emptyData } from "@/lib/seed";
import { supabase } from "@/integrations/supabase/client";
import { goalToRow, habitToRow, importData, loadUserData, todayInZone } from "@/lib/cloud-data";
import { useAuth } from "./AuthContext";

/** Legacy key from the local-only version; read once for the import prompt. */
export const LEGACY_STORAGE_KEY = "habit-tracker:v1";

const uid = () => crypto.randomUUID().slice(0, 12);

interface Ctx extends HabitData {
  loaded: boolean;
  loadError: string | null;
  reload: () => void;
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
  addGoal: (g: Omit<Goal, "id">) => void;
  deleteGoal: (id: string) => void;
  statsFor: (h: Habit) => HabitStats;
  categoryName: (id: string) => string;
  routineName: (id: string | null) => string;
  pendingImport: HabitData | null;
  runImport: () => Promise<void>;
  skipImport: () => void;
}

const HabitsContext = createContext<Ctx | null>(null);

function readLegacy(): HabitData | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const d = { ...emptyData(), ...JSON.parse(raw) } as HabitData;
    return d.habits.some((h) => !h.sample) ? d : null;
  } catch {
    return null;
  }
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const tz = profile?.timezone ?? (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
  const [data, setData] = useState<HabitData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [today, setToday] = useState(() => todayInZone(tz));
  const [pendingImport, setPendingImport] = useState<HabitData | null>(null);
  const [nonce, setNonce] = useState(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setToday(todayInZone(tz));
    const t = setInterval(() => setToday((prev) => {
      const n = todayInZone(tz);
      return n.getTime() === prev.getTime() ? prev : n;
    }), 60_000);
    return () => clearInterval(t);
  }, [tz]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoadError(null);
    loadUserData(supabase)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoaded(true);
        const legacy = readLegacy();
        if (legacy && localStorage.getItem(`habit-tracker:import-skipped:${userId}`) !== "1") setPendingImport(legacy);
      })
      .catch((e: Error) => !cancelled && setLoadError(e.message || "Couldn't load your habits."));
    return () => { cancelled = true; };
  }, [userId, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  /** Run a DB write; on failure tell the user and offer retry. Optimistic state is already applied. */
  const persist = useCallback((label: string, op: () => PromiseLike<{ error: { message: string } | null }>) => {
    const run = async () => {
      try {
        const { error } = await op();
        if (error) throw new Error(error.message);
      } catch (e) {
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        toast.error(offline ? `You're offline — couldn't save ${label}.` : `Couldn't save ${label}.`, {
          description: offline ? "Reconnect and tap Retry." : (e as Error).message,
          action: { label: "Retry", onClick: () => void run() },
          duration: 10000,
        });
      }
    };
    void run();
  }, []);

  const todayKey = today.getTime();

  const value = useMemo<Ctx>(() => {
    const u = userId ?? "";
    const localKey = () => toKey(todayInZone(tz));
    const make = (h: Omit<Habit, "id" | "createdAt" | "archived">): Habit => ({ ...h, id: uid(), archived: false, createdAt: localKey() });
    return {
      ...data,
      loaded,
      loadError,
      reload,
      today,
      activeHabits: data.habits.filter((h) => !h.archived),
      hasSample: false,
      addHabit: (h) => {
        const nh = make(h);
        setData((d) => ({ ...d, habits: [...d.habits, nh] }));
        persist("your habit", () => supabase.from("habits").upsert(habitToRow(nh, u)));
        return nh;
      },
      addHabits: (hs) => {
        const list = hs.map(make);
        setData((d) => ({ ...d, habits: [...d.habits, ...list] }));
        persist("your habits", () => supabase.from("habits").upsert(list.map((h) => habitToRow(h, u))));
      },
      updateHabit: (id, patch) => {
        const cur = dataRef.current.habits.find((h) => h.id === id);
        if (!cur) return;
        const next = { ...cur, ...patch };
        setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? next : h)) }));
        persist("your change", () => supabase.from("habits").upsert(habitToRow(next, u)));
      },
      deleteHabit: (id) => {
        setData((d) => ({
          ...d,
          habits: d.habits.filter((h) => h.id !== id),
          goals: d.goals.filter((g) => g.habitId !== id),
          completions: Object.fromEntries(Object.entries(d.completions).filter(([, c]) => c.habitId !== id)),
        }));
        persist("the deletion", async () => {
          const a = await supabase.from("completions").delete().eq("habit_id", id);
          if (a.error) return a;
          const b = await supabase.from("goals").delete().eq("habit_id", id);
          if (b.error) return b;
          return supabase.from("habits").delete().eq("id", id);
        });
      },
      toggle: (habitId, date) => {
        const k = completionKey(habitId, date);
        const exists = !!dataRef.current.completions[k];
        setData((d) => {
          const completions = { ...d.completions };
          if (completions[k]) delete completions[k];
          else completions[k] = { habitId, date };
          return { ...d, completions };
        });
        persist("your check-in", () =>
          exists
            ? supabase.from("completions").delete().eq("habit_id", habitId).eq("day", date)
            : supabase.from("completions").upsert({ user_id: u, habit_id: habitId, day: date }),
        );
      },
      setNote: (habitId, date, note) => {
        const clean = note.trim() || undefined;
        setData((d) => {
          const k = completionKey(habitId, date);
          const existing = d.completions[k] ?? { habitId, date };
          return { ...d, completions: { ...d.completions, [k]: { ...existing, note: clean } } };
        });
        persist("your note", () => supabase.from("completions").upsert({ user_id: u, habit_id: habitId, day: date, note: clean ?? null }));
      },
      addCategory: (name) => {
        const c = { id: uid(), name: name.trim() };
        setData((d) => ({ ...d, categories: [...d.categories, c] }));
        persist("the category", () => supabase.from("categories").upsert({ user_id: u, id: c.id, name: c.name }));
        return c;
      },
      deleteCategory: (id) => {
        setData((d) => ({
          ...d,
          categories: d.categories.filter((c) => c.id !== id),
          habits: d.habits.map((h) => (h.categoryId === id ? { ...h, categoryId: "other" } : h)),
        }));
        persist("the category change", async () => {
          const a = await supabase.from("habits").update({ category_id: "other" }).eq("category_id", id);
          if (a.error) return a;
          return supabase.from("categories").delete().eq("id", id);
        });
      },
      addRoutine: (name) => {
        const r = { id: uid(), name: name.trim(), order: data.routines.length };
        setData((d) => ({ ...d, routines: [...d.routines, r] }));
        persist("the routine", () => supabase.from("routines").upsert({ user_id: u, id: r.id, name: r.name, sort_order: r.order }));
        return r;
      },
      deleteRoutine: (id) => {
        setData((d) => ({
          ...d,
          routines: d.routines.filter((r) => r.id !== id),
          habits: d.habits.map((h) => (h.routineId === id ? { ...h, routineId: null } : h)),
        }));
        persist("the routine change", async () => {
          const a = await supabase.from("habits").update({ routine_id: null }).eq("routine_id", id);
          if (a.error) return a;
          return supabase.from("routines").delete().eq("id", id);
        });
      },
      markCelebrated: (date) => {
        if (dataRef.current.celebrated.includes(date)) return;
        setData((d) => ({ ...d, celebrated: [...d.celebrated, date] }));
        persist("today's celebration", () => supabase.from("celebrations").upsert({ user_id: u, day: date }));
      },
      clearSample: () => undefined,
      addGoal: (g) => {
        const ng = { ...g, id: uid() };
        setData((d) => ({ ...d, goals: [...d.goals, ng] }));
        persist("your goal", () => supabase.from("goals").upsert(goalToRow(ng, u)));
      },
      deleteGoal: (id) => {
        setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
        persist("the goal deletion", () => supabase.from("goals").delete().eq("id", id));
      },
      statsFor: (h) => habitStats(h, data.completions, today),
      categoryName: (id) => data.categories.find((c) => c.id === id)?.name ?? "Other",
      routineName: (id) => data.routines.find((r) => r.id === id)?.name ?? "Anytime",
      pendingImport,
      runImport: async () => {
        if (!pendingImport || !userId) return;
        await importData(supabase, userId, pendingImport);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        setPendingImport(null);
        setData(await loadUserData(supabase));
      },
      skipImport: () => {
        if (userId) localStorage.setItem(`habit-tracker:import-skipped:${userId}`, "1");
        setPendingImport(null);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loaded, loadError, todayKey, userId, tz, pendingImport, persist, reload]);

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used inside HabitsProvider");
  return ctx;
}
