import { useEffect } from "react";
import { PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Celebration({ show, onClose }: { show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!show) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
        setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.5 }, disableForReducedMotion: true }), 250);
      });
    }
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div role="status" className="fixed inset-x-4 top-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-hero p-4 text-primary-foreground shadow-card animate-in fade-in slide-in-from-top-4 motion-reduce:animate-none">
      <PartyPopper className="size-8 shrink-0" />
      <div className="flex-1">
        <div className="font-display text-lg font-bold">All done for today!</div>
        <div className="text-sm opacity-90">Every habit checked. That's how streaks are built.</div>
      </div>
      <Button size="icon" variant="ghost" onClick={onClose} aria-label="Dismiss" className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground">
        <X />
      </Button>
    </div>
  );
}
