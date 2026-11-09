import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Category, Goal, Habit, HabitData, HabitStats, Routine } from "@/types/habit";
import { completionKey, habitStats, toKey } from "@/lib/habit-logic";
import { emptyData } from "@/lib/seed";
import { supabase } from "@/integrations/supabase/client";
import { goalToRow, habitToRow, importData, loadUserData, todayInZone } from "@/lib/cloud-data";
import { useAuth } from "./AuthContext";
import { enqueue, flushQueue, readCache, readQueue, writeCache, type SyncOp } from "@/lib/sync-queue";

/** Legacy key from the local-only version; read once for the import prompt. */
export const LEGACY_STORAGE_KEY = "habit-tracker:v1";

const uid = () => crypto.randomUUID().slice(0, 12);

interface Ctx extends HabitData {
  loaded: boolean;
  loadError: string | null;
  pendingSync: number;
  syncNow: () => void;
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
    const cached = readCache(userId);
    if (cached) { setData(cached); setLoaded(true); }
    flushQueue(supabase, userId).catch(() => null).then(() => loadUserData(supabase))
      .then((d) => {
        if (cancelled) return;
        if (readQueue(userId).length) return; // unsynced local edits win until they sync
        if (cancelled) return;
        setData(d);
        setLoaded(true);
        const legacy = readLegacy();
        if (legacy && localStorage.getItem(`habit-tracker:import-skipped:${userId}`) !== "1") setPendingImport(legacy);
      })
      .catch((e: Error) => !cancelled && !cached && setLoadError(e.message || "Couldn't load your habits."));
    return () => { cancelled = true; };
  }, [userId, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const [pending, setPending] = useState(0);
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    if (!userId || flushing.current || (typeof navigator !== "undefined" && !navigator.onLine)) return;
    if (!readQueue(userId).length) return;
    flushing.current = true;
    try {
      const r = await flushQueue(supabase, userId);
      setPending(r.remaining);
      if (r.synced) toast.success(`Synced ${r.synced} offline change${r.synced > 1 ? "s" : ""}.`);
      if (r.dropped.length) toast.error(`Couldn't sync ${r.dropped.join(", ")}.`);
    } finally {
      flushing.current = false;
    }
  }, [userId]);

  /** Save via the outbox: write now if possible; on network failure keep it queued and sync later. */
  const persist = useCallback((label: string, ops: SyncOp[]) => {
    if (!userId) return;
    enqueue(userId, { id: uid(), label, ops, attempts: 0 });
    setPending(readQueue(userId).length);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast(`Saved offline — will sync when you're back online.`, { id: "offline-save" });
      return;
    }
    void flush();
  }, [userId, flush]);

  useEffect(() => {
    if (!userId) return;
    setPending(readQueue(userId).length);
    const on = () => void flush();
    const vis = () => document.visibilityState === "visible" && void flush();
    window.addEventListener("online", on);
    document.addEventListener("visibilitychange", vis);
    const t = setInterval(on, 30_000);
    return () => { window.removeEventListener("online", on); document.removeEventListener("visibilitychange", vis); clearInterval(t); };
  }, [userId, flush]);

  useEffect(() => { if (userId && loaded) writeCache(userId, data); }, [userId, loaded, data]);

  const todayKey = today.getTime();

  const value = useMemo<Ctx>(() => {
    const u = userId ?? "";
    const localKey = () => toKey(todayInZone(tz));
    const make = (h: Omit<Habit, "id" | "createdAt" | "archived">): Habit => ({ ...h, id: uid(), archived: false, createdAt: localKey() });
    return {
      ...data,
      loaded,
      loadError,
      pendingSync: pending,
      syncNow: () => void flush(),
      reload,
      today,
      activeHabits: data.habits.filter((h) => !h.archived),
      hasSample: false,
      addHabit: (h) => {
        const nh = make(h);
        setData((d) => ({ ...d, habits: [...d.habits, nh] }));
        persist("your habit", [{ kind: "upsert", table: "habits", rows: habitToRow(nh, u) }]);
        return nh;
      },
      addHabits: (hs) => {
        const list = hs.map(make);
        setData((d) => ({ ...d, habits: [...d.habits, ...list] }));
        persist("your habits", [{ kind: "upsert", table: "habits", rows: list.map((h) => habitToRow(h, u)) }]);
      },
      updateHabit: (id, patch) => {
        const cur = dataRef.current.habits.find((h) => h.id === id);
        if (!cur) return;
        const next = { ...cur, ...patch };
        setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? next : h)) }));
        persist("your change", [{ kind: "upsert", table: "habits", rows: habitToRow(next, u) }]);
      },
      deleteHabit: (id) => {
        setData((d) => ({
          ...d,
          habits: d.habits.filter((h) => h.id !== id),
          goals: d.goals.filter((g) => g.habitId !== id),
          completions: Object.fromEntries(Object.entries(d.completions).filter(([, c]) => c.habitId !== id)),
        }));
        persist("the deletion", [
          { kind: "delete", table: "completions", match: { habit_id: id } },
          { kind: "delete", table: "goals", match: { habit_id: id } },
          { kind: "delete", table: "habits", match: { id } },
        ]);
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
        persist("your check-in", [
          exists
            ? { kind: "delete", table: "completions", match: { habit_id: habitId, day: date } }
            : { kind: "upsert", table: "completions", rows: { user_id: u, habit_id: habitId, day: date } },
        ]);
      },
      setNote: (habitId, date, note) => {
        const clean = note.trim() || undefined;
        setData((d) => {
          const k = completionKey(habitId, date);
          const existing = d.completions[k] ?? { habitId, date };
          return { ...d, completions: { ...d.completions, [k]: { ...existing, note: clean } } };
        });
        persist("your note", [{ kind: "upsert", table: "completions", rows: { user_id: u, habit_id: habitId, day: date, note: clean ?? null } }]);
      },
      addCategory: (name) => {
        const c = { id: uid(), name: name.trim() };
        setData((d) => ({ ...d, categories: [...d.categories, c] }));
        persist("the category", [{ kind: "upsert", table: "categories", rows: { user_id: u, id: c.id, name: c.name } }]);
        return c;
      },
      deleteCategory: (id) => {
        setData((d) => ({
          ...d,
          categories: d.categories.filter((c) => c.id !== id),
          habits: d.habits.map((h) => (h.categoryId === id ? { ...h, categoryId: "other" } : h)),
        }));
        persist("the category change", [
          { kind: "update", table: "habits", values: { category_id: "other" }, match: { category_id: id } },
          { kind: "delete", table: "categories", match: { id } },
        ]);
      },
      addRoutine: (name) => {
        const r = { id: uid(), name: name.trim(), order: data.routines.length };
        setData((d) => ({ ...d, routines: [...d.routines, r] }));
        persist("the routine", [{ kind: "upsert", table: "routines", rows: { user_id: u, id: r.id, name: r.name, sort_order: r.order } }]);
        return r;
      },
      deleteRoutine: (id) => {
        setData((d) => ({
          ...d,
          routines: d.routines.filter((r) => r.id !== id),
          habits: d.habits.map((h) => (h.routineId === id ? { ...h, routineId: null } : h)),
        }));
        persist("the routine change", [
          { kind: "update", table: "habits", values: { routine_id: null }, match: { routine_id: id } },
          { kind: "delete", table: "routines", match: { id } },
        ]);
      },
      markCelebrated: (date) => {
        if (dataRef.current.celebrated.includes(date)) return;
        setData((d) => ({ ...d, celebrated: [...d.celebrated, date] }));
        persist("today's celebration", [{ kind: "upsert", table: "celebrations", rows: { user_id: u, day: date } }]);
      },
      clearSample: () => undefined,
      addGoal: (g) => {
        const ng = { ...g, id: uid() };
        setData((d) => ({ ...d, goals: [...d.goals, ng] }));
        persist("your goal", [{ kind: "upsert", table: "goals", rows: goalToRow(ng, u) }]);
      },
      deleteGoal: (id) => {
        setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
        persist("the goal deletion", [{ kind: "delete", table: "goals", match: { id } }]);
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
  }, [data, loaded, loadError, todayKey, userId, tz, pendingImport, persist, reload, pending, flush]);

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used inside HabitsProvider");
  return ctx;
}
