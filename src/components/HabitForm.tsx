import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHabits } from "@/context/HabitsContext";
import { WEEKDAY_SHORT } from "@/lib/habit-logic";
import { cn } from "@/lib/utils";
import { HABIT_COLORS, type Frequency, type Habit, type HabitColor } from "@/types/habit";
import { habitStyle } from "./habit-ui";

export const ICONS = [
  "💧", "🧘", "🏋️", "🏃", "🚴", "🥗", "🍎", "💊", "😴", "🛏️", "🌅", "🌙",
  "💻", "⌨️", "🧠", "📚", "📖", "✍️", "📝", "🎓", "🗣️", "🎧", "🎸", "🎨",
  "📞", "❤️", "🤝", "🧹", "🪴", "🚭", "📵", "☕", "🦷", "🚶", "⏰", "⭐",
];

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="size-12 text-2xl" aria-label="Choose icon">
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="grid w-72 grid-cols-6 gap-1">
        {ICONS.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => { onChange(i); setOpen(false); }}
            className={cn("flex size-10 items-center justify-center rounded-lg text-xl hover:bg-accent", i === value && "bg-accent")}
          >
            {i}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function FrequencyEditor({ value, onChange }: { value: Frequency; onChange: (f: Frequency) => void }) {
  return (
    <div className="space-y-2">
      <Select
        value={value.type}
        onValueChange={(t) =>
          onChange(t === "daily" ? { type: "daily" } : t === "weekdays" ? { type: "weekdays", days: [1, 3, 5] } : { type: "weekly", times: 3 })
        }
      >
        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Every day</SelectItem>
          <SelectItem value="weekdays">Specific weekdays</SelectItem>
          <SelectItem value="weekly">X times per week</SelectItem>
        </SelectContent>
      </Select>
      {value.type === "weekdays" && (
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const on = value.days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const days = on ? value.days.filter((x) => x !== d) : [...value.days, d];
                  if (days.length) onChange({ type: "weekdays", days });
                }}
                className={cn("h-10 w-11 rounded-lg border text-xs font-semibold", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
              >
                {WEEKDAY_SHORT[d]}
              </button>
            );
          })}
        </div>
      )}
      {value.type === "weekly" && (
        <div className="flex items-center gap-2 text-sm">
          <Input
            type="number"
            min={1}
            max={7}
            value={value.times}
            onChange={(e) => onChange({ type: "weekly", times: Math.max(1, Math.min(7, Number(e.target.value) || 1)) })}
            className="h-10 w-20"
          />
          times per week
        </div>
      )}
    </div>
  );
}

type Draft = Omit<Habit, "id" | "createdAt" | "archived">;
const blank: Draft = { name: "", icon: "⭐", color: "coral", categoryId: "health", routineId: "morning", frequency: { type: "daily" }, reminder: "" };

export function HabitForm({ open, onOpenChange, habit }: { open: boolean; onOpenChange: (o: boolean) => void; habit?: Habit }) {
  const { categories, routines, addHabit, updateHabit, addCategory } = useHabits();
  const [d, setD] = useState<Draft>(blank);
  const [newCat, setNewCat] = useState("");
  useEffect(() => {
    if (open) setD(habit ? { ...habit } : blank);
  }, [open, habit]);

  const save = () => {
    if (!d.name.trim()) return;
    const clean = { ...d, name: d.name.trim(), reminder: d.reminder?.trim() || undefined };
    if (habit) updateHabit(habit.id, clean);
    else addHabit(clean);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <IconPicker value={d.icon} onChange={(icon) => setD({ ...d, icon })} />
            <Input autoFocus placeholder="e.g. Read 10 pages" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label className="mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c: HabitColor) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  style={habitStyle(c)}
                  onClick={() => setD({ ...d, color: c })}
                  className={cn("habit-solid size-9 rounded-full ring-offset-2 ring-offset-background", d.color === c && "ring-2 ring-foreground")}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Category</Label>
              <Select
                value={d.categoryId}
                onValueChange={(v) => {
                  if (v === "__new") return;
                  setD({ ...d, categoryId: v });
                }}
              >
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="mt-2 flex gap-1">
                <Input placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} className="h-9" />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    if (!newCat.trim()) return;
                    const c = addCategory(newCat);
                    setD({ ...d, categoryId: c.id });
                    setNewCat("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Routine</Label>
              <Select value={d.routineId ?? "none"} onValueChange={(v) => setD({ ...d, routineId: v === "none" ? null : v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {routines.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  <SelectItem value="none">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">How often</Label>
            <FrequencyEditor value={d.frequency} onChange={(frequency) => setD({ ...d, frequency })} />
          </div>
          <div>
            <Label className="mb-2 block">Reminder (optional)</Label>
            <Input placeholder="e.g. 7:00 AM" value={d.reminder ?? ""} onChange={(e) => setD({ ...d, reminder: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!d.name.trim()}>{habit ? "Save" : "Create habit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
