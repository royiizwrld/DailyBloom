import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/context/HabitsContext";
import { useInstall } from "./InstallContext";
import { IosInstallDialog } from "./IosInstallDialog";

/** Shown only inside signed-in pages (never on landing / auth screens). */
export function InstallBanner() {
  const { canPrompt, isIos, isStandalone, installed, visits, suppressed, promptInstall, dismiss, never } = useInstall();
  const { habits, loaded } = useHabits();
  const [iosOpen, setIosOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const engaged = visits >= 2 || habits.length > 0;
  const show = !hidden && loaded && !suppressed && !isStandalone && !installed && (canPrompt || isIos) && engaged;

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { dismiss(); setHidden(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, dismiss]);

  if (!show && !iosOpen) return null;
  return (
    <>
      {show && (
        <div
          ref={ref}
          role="dialog"
          aria-modal="false"
          aria-labelledby="install-title"
          aria-describedby="install-desc"
          className="fixed inset-x-0 bottom-0 z-50 border-t bg-card p-4 shadow-2xl [padding-bottom:calc(1rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96 sm:rounded-2xl sm:border sm:[padding-bottom:1rem] md:bottom-6"
        >
          <button type="button" aria-label="Close install banner" onClick={() => { dismiss(); setHidden(true); }} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent">
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Download className="size-5" /></span>
            <div>
              <h2 id="install-title" className="font-display font-semibold">Install Habit Tracker</h2>
              <p id="install-desc" className="text-sm text-muted-foreground">Open it from your home screen in one tap, full screen, like a regular app.</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canPrompt ? (
              <Button autoFocus onClick={() => void promptInstall()}>Install</Button>
            ) : (
              <Button autoFocus onClick={() => setIosOpen(true)}>How to install</Button>
            )}
            <Button variant="outline" onClick={() => { dismiss(); setHidden(true); }}>Not now</Button>
            <Button variant="ghost" size="sm" onClick={() => { never(); setHidden(true); }}>Don't ask again</Button>
          </div>
        </div>
      )}
      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </>
  );
}
