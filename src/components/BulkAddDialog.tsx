import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHabits } from "@/context/HabitsContext";
import { findDuplicate } from "@/lib/habit-logic";
import { HABIT_COLORS, type Frequency, type Habit } from "@/types/habit";
import { FrequencyEditor, IconPicker } from "./HabitForm";

type Row = { key: string; name: string; icon: string; categoryId: string; routineId: string | null; frequency: Frequency };

type AiHabit = {
  name: string; icon: string; category: string; frequencyType: string;
  weekdays: number[]; timesPerWeek: number | null; routine: string | null;
};

const EXAMPLE = `Morning: wake up 6am, drink water, 20 min stretching, read 10 pages

Gym Mon/Wed/Fri, code 1 hour weekdays, journal before bed, no phone after 10pm`;

export function BulkAddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { categories, routines, habits, addHabits } = useHabits();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toRow = (a: AiHabit, i: number): Row => {
    const cat = categories.find((c) => c.name.toLowerCase() === String(a.category).toLowerCase())?.id ?? "other";
    const rt = routines.find((r) => r.name.toLowerCase() === String(a.routine ?? "").toLowerCase())?.id ?? null;
    const days = (a.weekdays ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    const frequency: Frequency =
      a.frequencyType === "weekdays" && days.length
        ? { type: "weekdays", days }
        : a.frequencyType === "weekly"
          ? { type: "weekly", times: Math.min(7, Math.max(1, a.timesPerWeek ?? 3)) }
          : { type: "daily" };
    return { key: `${i}-${a.name}`, name: String(a.name).slice(0, 80), icon: a.icon?.slice(0, 4) || "⭐", categoryId: cat, routineId: rt, frequency };
  };

  const parse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bulk-parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || !Array.isArray(json.habits)) {
        setError(json?.error ?? "The AI response didn't look right. Please try again.");
        return;
      }
      setRows(json.habits.map(toRow));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const patch = (key: string, p: Partial<Row>) => setRows((r) => r?.map((x) => (x.key === key ? { ...x, ...p } : x)) ?? null);

  const confirm = () => {
    if (!rows?.length) return;
    const list: Omit<Habit, "id" | "createdAt" | "archived">[] = rows
      .filter((r) => r.name.trim())
      .map(({ key: _key, ...r }, i) => ({ ...r, name: r.name.trim(), color: HABIT_COLORS[i % HABIT_COLORS.length]! }));
    addHabits(list);
    toast.success(`Added ${list.length} habit${list.length === 1 ? "" : "s"}`);
    setRows(null);
    setText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk add habits</DialogTitle>
          <DialogDescription>Describe your routine in your own words. You'll review everything before it's saved.</DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="space-y-3">
            <Textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} maxLength={4000} />
            <button type="button" className="text-xs text-primary underline" onClick={() => setText(EXAMPLE)}>Use example</button>
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.length === 0 && <p className="text-sm text-muted-foreground">All rows removed.</p>}
            {rows.map((r) => {
              const dup = findDuplicate(r.name, habits);
              return (
                <div key={r.key} className="space-y-2 rounded-2xl border bg-card p-3">
                  <div className="flex gap-2">
                    <IconPicker value={r.icon} onChange={(icon) => patch(r.key, { icon })} />
                    <Input value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} className="h-12" aria-label="Habit name" />
                    <Button variant="ghost" size="icon" className="size-12" onClick={() => setRows(rows.filter((x) => x.key !== r.key))} aria-label="Remove row">
                      <Trash2 />
                    </Button>
                  </div>
                  {dup && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertTriangle className="size-3.5" /> Possible duplicate of "{dup.name}"
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Select value={r.categoryId} onValueChange={(v) => patch(r.key, { categoryId: v })}>
                      <SelectTrigger className="h-10" aria-label="Category"><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={r.routineId ?? "none"} onValueChange={(v) => patch(r.key, { routineId: v === "none" ? null : v })}>
                      <SelectTrigger className="h-10" aria-label="Routine"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {routines.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
                        <SelectItem value="none">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                    <FrequencyEditor value={r.frequency} onChange={(frequency) => patch(r.key, { frequency })} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          {rows ? (
            <>
              <Button variant="ghost" onClick={() => setRows(null)}>Back</Button>
              <Button onClick={confirm} disabled={!rows.length}>Confirm & Add ({rows.length})</Button>
            </>
          ) : (
            <Button onClick={parse} disabled={loading || !text.trim()}>
              {loading && <Loader2 className="animate-spin" />} {loading ? "Reading your routine…" : "Suggest habits"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
