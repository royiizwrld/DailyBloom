import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const DISMISS_KEY = "pwa:install-dismissed-at";
export const NEVER_KEY = "pwa:install-never";
export const INSTALLED_KEY = "pwa:installed";
const VISITS_KEY = "pwa:visits";
const DAYS_14 = 14 * 24 * 60 * 60 * 1000;

interface InstallCtx {
  canPrompt: boolean;
  isIos: boolean;
  isStandalone: boolean;
  installed: boolean;
  visits: number;
  suppressed: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  dismiss: () => void;
  never: () => void;
}

const Ctx = createContext<InstallCtx | null>(null);

export function detectStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function detectIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return ios && safari;
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [visits, setVisits] = useState(0);
  const [suppressed, setSuppressed] = useState(true);

  useEffect(() => {
    setIsIos(detectIosSafari());
    setStandalone(detectStandalone());
    setInstalled(localStorage.getItem(INSTALLED_KEY) === "1");
    let v = Number(localStorage.getItem(VISITS_KEY) || "0");
    if (!sessionStorage.getItem(VISITS_KEY)) {
      v += 1;
      localStorage.setItem(VISITS_KEY, String(v));
      sessionStorage.setItem(VISITS_KEY, "1");
    }
    setVisits(v);
    const at = Number(localStorage.getItem(DISMISS_KEY) || "0");
    setSuppressed(localStorage.getItem(NEVER_KEY) === "1" || Date.now() - at < DAYS_14);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setSuppressed(true);
  }, []);
  const never = useCallback(() => {
    localStorage.setItem(NEVER_KEY, "1");
    setSuppressed(true);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!evt) return "unavailable" as const;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    setEvt(null);
    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "1");
      setInstalled(true);
      toast.success("Thanks for installing Habit Tracker!");
    } else {
      dismiss();
    }
    return outcome;
  }, [evt, dismiss]);

  return (
    <Ctx.Provider value={{ canPrompt: !!evt, isIos, isStandalone, installed, visits, suppressed, promptInstall, dismiss, never }}>
      {children}
    </Ctx.Provider>
  );
}

export function useInstall() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useInstall must be used inside InstallProvider");
  return c;
}
