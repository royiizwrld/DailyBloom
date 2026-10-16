import { describe, expect, it } from "vitest";
import { computeStreaks, completionKey, isDueOn, shouldCelebrate, type CompletionMap } from "@/lib/habit-logic";
import type { Habit } from "@/types/habit";

const base: Habit = {
  id: "h", name: "x", icon: "x", color: "coral", categoryId: "c", routineId: null,
  frequency: { type: "daily" }, archived: false, createdAt: "2026-09-01",
};
const logs = (...dates: string[]): CompletionMap =>
  Object.fromEntries(dates.map((d) => [completionKey("h", d), { habitId: "h", date: d }]));

describe("streaks", () => {
  it("daily: today unchecked does not break streak", () => {
    const s = computeStreaks(base, logs("2026-10-13", "2026-10-14", "2026-10-15"), new Date(2026, 9, 16));
    expect(s.current).toBe(3);
  });
  it("weekdays Mon/Wed/Fri: non-due days don't break streak", () => {
    const h = { ...base, frequency: { type: "weekdays" as const, days: [1, 3, 5] } };
    // Mon 12, Wed 14, Fri 16 Oct 2026
    const s = computeStreaks(h, logs("2026-10-12", "2026-10-14", "2026-10-16"), new Date(2026, 9, 18));
    expect(s.current).toBe(3);
  });
  it("weekly 3x: counts consecutive weeks meeting target", () => {
    const h = { ...base, frequency: { type: "weekly" as const, times: 3 } };
    const c = logs("2026-09-28", "2026-09-29", "2026-09-30", "2026-10-05", "2026-10-07", "2026-10-09");
    expect(computeStreaks(h, c, new Date(2026, 9, 13)).current).toBe(2);
  });
});

describe("due", () => {
  it("weekly habit disappears after target is met on other days", () => {
    const h = { ...base, frequency: { type: "weekly" as const, times: 2 } };
    const c = logs("2026-10-12", "2026-10-13");
    expect(isDueOn(h, new Date(2026, 9, 14), c)).toBe(false);
    expect(isDueOn(h, new Date(2026, 9, 13), c)).toBe(true);
  });
});

describe("celebration", () => {
  it("fires once per day only", () => {
    expect(shouldCelebrate(3, 3, "2026-10-16", [])).toBe(true);
    expect(shouldCelebrate(3, 3, "2026-10-16", ["2026-10-16"])).toBe(false);
    expect(shouldCelebrate(3, 2, "2026-10-16", [])).toBe(false);
  });
});
