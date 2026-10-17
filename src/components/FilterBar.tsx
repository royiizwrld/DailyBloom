import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHabits } from "@/context/HabitsContext";
import type { Filters, Habit } from "@/types/habit";

export const applyFilters = (habits: Habit[], f: Filters) =>
  habits.filter(
    (h) =>
      (f.categoryId === "all" || h.categoryId === f.categoryId) &&
      (f.routineId === "all" || (f.routineId === "none" ? !h.routineId : h.routineId === f.routineId)),
  );

export function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const { categories, routines } = useHabits();
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={value.categoryId} onValueChange={(v) => onChange({ ...value, categoryId: v })}>
        <SelectTrigger className="h-10 w-auto min-w-36 rounded-full" aria-label="Filter by category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={value.routineId} onValueChange={(v) => onChange({ ...value, routineId: v })}>
        <SelectTrigger className="h-10 w-auto min-w-36 rounded-full" aria-label="Filter by routine">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All routines</SelectItem>
          {routines.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
          ))}
          <SelectItem value="none">Anytime</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
