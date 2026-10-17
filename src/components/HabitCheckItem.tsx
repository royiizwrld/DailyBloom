import { Link } from "@tanstack/react-router";
import { Check, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useHabits } from "@/context/HabitsContext";
import { completionKey, frequencyLabel, weekCount } from "@/lib/habit-logic";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types/habit";
import { habitStyle } from "./habit-ui";

export function HabitCheckItem({ habit, date, dateObj }: { habit: Habit; date: string; dateObj: Date }) {
  const { completions, toggle, setNote, statsFor } = useHabits();
  const c = completions[completionKey(habit.id, date)];
  const done = !!c;
  const [note, setNoteDraft] = useState(c?.note ?? "");
  const stats = statsFor(habit);
  const weekly = habit.frequency.type === "weekly" ? { n: weekCount(completions, habit.id, dateObj), t: habit.frequency.times } : null;

  return (
    <div
      style={habitStyle(habit.color)}
      className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card transition-colors", done && "habit-tint")}
    >
      <button
        type="button"
        onClick={() => toggle(habit.id, date)}
        aria-pressed={done}
        aria-label={done ? `Undo ${habit.name}` : `Mark ${habit.name} done`}
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform active:scale-95 motion-reduce:transition-none",
          done ? "habit-solid text-primary-foreground" : "habit-tint",
        )}
      >
        {done ? <Check className="size-7" strokeWidth={3} /> : habit.icon}
      </button>
      <Link to="/habits/$id" params={{ id: habit.id }} className="min-w-0 flex-1">
        <div className={cn("truncate font-medium", done && "text-muted-foreground line-through")}>{habit.name}</div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{frequencyLabel(habit.frequency)}</span>
          {habit.reminder && <span>· {habit.reminder}</span>}
          {stats.currentStreak > 0 && (
            <span className="habit-text font-semibold">· 🔥 {stats.currentStreak} {stats.streakUnit === "weeks" ? "wk" : "d"}</span>
          )}
        </div>
        {c?.note && <div className="mt-0.5 truncate text-xs italic text-muted-foreground">"{c.note}"</div>}
      </Link>
      {weekly && (
        <span className="habit-tint rounded-full px-2.5 py-1 text-xs font-semibold">
          {weekly.n}/{weekly.t} wk
        </span>
      )}
      {done && (
        <Popover onOpenChange={(o) => o && setNoteDraft(c?.note ?? "")}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Add a note" className="size-11">
              <MessageSquareText className="size-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-2">
            <div className="text-sm font-medium">Note for this check-in</div>
            <Textarea
              maxLength={140}
              value={note}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="e.g. felt tired, did a short version"
            />
            <Button size="sm" className="w-full" onClick={() => setNote(habit.id, date, note)}>Save note</Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
