export type Frequency =
  | { type: "daily" }
  | { type: "weekdays"; days: number[] } // 0 = Sunday ... 6 = Saturday
  | { type: "weekly"; times: number };

export type HabitColor = "coral" | "amber" | "lime" | "teal" | "sky" | "violet" | "rose" | "slate";

export const HABIT_COLORS: HabitColor[] = ["coral", "amber", "lime", "teal", "sky", "violet", "rose", "slate"];

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: HabitColor;
  categoryId: string;
  routineId: string | null;
  frequency: Frequency;
  reminder?: string;
  archived: boolean;
  createdAt: string; // yyyy-MM-dd
  sample?: boolean;
}

export interface Category {
  id: string;
  name: string;
  builtIn?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  order: number;
}

export interface Completion {
  habitId: string;
  date: string; // yyyy-MM-dd
  note?: string;
}

export interface HabitData {
  habits: Habit[];
  categories: Category[];
  routines: Routine[];
  completions: Record<string, Completion>; // key: habitId|date
  celebrated: string[];
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  streakUnit: "days" | "weeks";
  rate30: number; // 0..1
  weekdayRates: (number | null)[]; // index 0 = Sunday
}

export type Filters = { categoryId: string | "all"; routineId: string | "all" };
