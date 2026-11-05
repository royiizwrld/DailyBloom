import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/context/HabitsContext";

export function ImportPrompt() {
  const { pendingImport, runImport, skipImport } = useHabits();
  const [busy, setBusy] = useState(false);
  if (!pendingImport) return null;
  const n = pendingImport.habits.filter((h) => !h.sample).length;
  const doImport = async () => {
    setBusy(true);
    try {
      await runImport();
      toast.success("Your habits are now saved to your account.");
    } catch (e) {
      toast.error("Import didn't finish. Your device data is untouched — try again.", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>We found habits saved on this device</AlertDialogTitle>
          <AlertDialogDescription>
            Import them to your account? That's {n} habit{n === 1 ? "" : "s"} plus their check-ins, notes and goals. After importing, the copy on this device is removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={skipImport} disabled={busy}>Skip</Button>
          <Button onClick={doImport} disabled={busy}>{busy ? "Importing…" : "Import"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
