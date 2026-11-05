import { PlusSquare, Share } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function IosInstallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install on iPhone or iPad</DialogTitle>
          <DialogDescription>Add Habit Tracker to your Home Screen in three taps.</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm">
          <li className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-accent font-semibold">1</span> Tap <Share className="size-4" aria-label="Share" /> <strong>Share</strong> in Safari's toolbar.</li>
          <li className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-accent font-semibold">2</span> Choose <PlusSquare className="size-4" aria-hidden /> <strong>Add to Home Screen</strong>.</li>
          <li className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-accent font-semibold">3</span> Tap <strong>Add</strong>.</li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
