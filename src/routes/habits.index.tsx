import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, ArchiveRestore, MoreVertical, Pencil, Plus, Sparkles as Wand, Trash2, X } from "lucide-react";
import { useState } from "react";
import { BulkAddDialog } from "@/components/BulkAddDialog";
import { HabitBadge, PageHeader } from "@/components/habit-ui";
import { HabitForm } from "@/components/HabitForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useHabits } from "@/context/HabitsContext";
import { frequencyLabel } from "@/lib/habit-logic";
import type { Habit } from "@/types/habit";

export const Route = createFileRoute("/habits/")({
  head: () => ({
    meta: [
      { title: "Your habits — Daily Bloom" },
      { name: "description", content: "Create, edit, archive and organise your habits, categories and routines." },
      { property: "og:title", content: "Your habits — Daily Bloom" },
      { property: "og:description", content: "Create, edit, archive and organise your habits, categories and routines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  const h = useHabits();
  const [editing, setEditing] = useState<Habit | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleting, setDeleting] = useState<Habit | null>(null);
  const [newCat, setNewCat] = useState("");
  const [newRoutine, setNewRoutine] = useState("");
  const active = h.habits.filter((x) => !x.archived);
  const archived = h.habits.filter((x) => x.archived);

  const row = (x: Habit) => {
    const s = h.statsFor(x);
    return (
      <div key={x.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
        <HabitBadge icon={x.icon} color={x.color} />
        <Link to="/habits/$id" params={{ id: x.id }} className="min-w-0 flex-1">
          <div className="truncate font-medium">{x.name}</div>
          <div className="text-xs text-muted-foreground">
            {frequencyLabel(x.frequency)} · {h.categoryName(x.categoryId)} · {h.routineName(x.routineId)}
            {!x.archived && ` · 🔥 ${s.currentStreak}`}
          </div>
        </Link>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-11" aria-label={`Options for ${x.name}`}><MoreVertical /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditing(x); setFormOpen(true); }}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => h.updateHabit(x.id, { archived: !x.archived })}>
              {x.archived ? <><ArchiveRestore /> Restore</> : <><Archive /> Archive</>}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(x)}><Trash2 /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle={`${active.length} active`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}><Wand /> Bulk add</Button>
            <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus /> New</Button>
          </div>
        }
      />

      {h.hasSample && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          <span>You're looking at sample habits with example history.</span>
          <Button size="sm" variant="outline" onClick={h.clearSample}>Clear sample data</Button>
        </div>
      )}

      <div className="space-y-2">{active.map(row)}</div>
      {active.length === 0 && <p className="py-8 text-center text-muted-foreground">No active habits yet.</p>}

      {archived.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Archived</h2>
          <div className="space-y-2 opacity-70">{archived.map(row)}</div>
        </>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <ManageList
          title="Categories"
          items={h.categories.map((c) => ({ id: c.id, name: c.name, removable: !c.builtIn }))}
          value={newCat}
          setValue={setNewCat}
          onAdd={() => { if (newCat.trim()) { h.addCategory(newCat); setNewCat(""); } }}
          onRemove={h.deleteCategory}
        />
        <ManageList
          title="Routines"
          items={h.routines.map((r) => ({ id: r.id, name: r.name, removable: true }))}
          value={newRoutine}
          setValue={setNewRoutine}
          onAdd={() => { if (newRoutine.trim()) { h.addRoutine(newRoutine); setNewRoutine(""); } }}
          onRemove={h.deleteRoutine}
        />
      </div>

      <HabitForm open={formOpen} onOpenChange={setFormOpen} habit={editing} />
      <BulkAddDialog open={bulkOpen} onOpenChange={setBulkOpen} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This removes the habit and all its history. Archive it instead to keep the history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleting) h.deleteHabit(deleting.id); setDeleting(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ManageList(p: {
  title: string; items: { id: string; name: string; removable: boolean }[]; value: string;
  setValue: (v: string) => void; onAdd: () => void; onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <h3 className="mb-3 font-semibold">{p.title}</h3>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {p.items.map((i) => (
          <span key={i.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
            {i.name}
            {i.removable && (
              <button onClick={() => p.onRemove(i.id)} aria-label={`Remove ${i.name}`} className="text-muted-foreground hover:text-destructive">
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); p.onAdd(); }}>
        <Input value={p.value} onChange={(e) => p.setValue(e.target.value)} placeholder={`Add ${p.title.toLowerCase().slice(0, -1)}`} />
        <Button type="submit" variant="secondary">Add</Button>
      </form>
    </div>
  );
}
