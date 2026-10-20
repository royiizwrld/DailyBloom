import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/habit-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHabits } from "@/context/HabitsContext";
import { goalProgress, toKey } from "@/lib/habit-logic";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals · Daily Bloom" },
      { name: "description", content: "Set targets like 30 days of reading and track them against your habit check-ins." },
      { property: "og:title", content: "Goals · Daily Bloom" },
      { property: "og:description", content: "Set habit targets and watch your check-ins fill them up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const data = useHabits();
  const goals = data.goals ?? [];
  const [habitId, setHabitId] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState(30);
  const [startDate, setStartDate] = useState(() => toKey(new Date()));
  const [deadline, setDeadline] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = data.activeHabits.find((x) => x.id === habitId);
    if (!h) { toast.error("Pick a habit for this goal"); return; }
    data.addGoal({ habitId, target: Math.max(1, target), startDate, deadline: deadline || undefined, name: name.trim() || `${target} days of ${h.name.toLowerCase()}` });
    setName(""); setDeadline("");
    toast.success("Goal added");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Goals" subtitle="Big targets, built from daily check-ins." />

      <form onSubmit={submit} className="grid gap-4 rounded-3xl border bg-card p-5 shadow-card sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Habit</Label>
          <Select value={habitId} onValueChange={setHabitId}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Choose a habit" /></SelectTrigger>
            <SelectContent>
              {data.activeHabits.map((h) => <SelectItem key={h.id} value={h.id}>{h.icon} {h.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="g-name">Goal name (optional)</Label>
          <Input id="g-name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="30 days of daily reading" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="g-target">Target check-ins</Label>
          <Input id="g-target" type="number" min={1} max={1000} className="h-11" value={target} onChange={(e) => setTarget(Number(e.target.value) || 1)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="g-start">Counting from</Label>
          <Input id="g-start" type="date" className="h-11" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="g-deadline">Deadline (optional)</Label>
          <Input id="g-deadline" type="date" className="h-11" value={deadline} min={startDate} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div className="flex items-end"><Button type="submit" className="h-11 w-full"><Target /> Add goal</Button></div>
      </form>

      {goals.length === 0 ? (
        <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">No goals yet. Try “30 days of daily reading”.</p>
      ) : (
        <div className="grid gap-3">
          {goals.map((g) => {
            const h = data.habits.find((x) => x.id === g.habitId);
            const p = goalProgress(g, data.completions, data.today);
            return (
              <div key={g.id} className="rounded-3xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-display text-lg font-semibold">
                      {p.complete && <Trophy className="size-5 text-primary" />} {g.name}
                    </div>
                    {h && <Link to="/habits/$id" params={{ id: h.id }} className="text-sm text-muted-foreground hover:underline">{h.icon} {h.name}</Link>}
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Delete goal" onClick={() => data.deleteGoal(g.id)}><Trash2 /></Button>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-hero transition-[width]" style={{ width: `${p.pct * 100}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="font-semibold">{p.done} / {p.target} check-ins</span>
                  <span className="text-muted-foreground">
                    {p.complete ? "Goal reached 🎉" : p.expired ? "Deadline passed — keep going or set a new one" : p.daysLeft !== null ? `${p.daysLeft} days left` : `${p.target - p.done} to go`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
