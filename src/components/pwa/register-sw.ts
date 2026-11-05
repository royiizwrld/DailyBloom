import { toast } from "sonner";

const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const LOVABLE_PREVIEW_DOMAINS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  if (LOVABLE_PREVIEW_DOMAINS.some((d) => host.endsWith(d)) && PREVIEW_LABEL.test(label)) return true;
  if (/^project--[a-z0-9-]+-dev$/.test(label) && LOVABLE_PREVIEW_DOMAINS.some((d) => host.endsWith(d))) return true;
  for (const d of ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"]) {
    if (host === d || host.endsWith(`.${d}`)) return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppSw() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js") || r.installing?.scriptURL.endsWith("/sw.js") || r.waiting?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
}

/** The only place the app service worker is registered. Call from useEffect. */
export function registerAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    void unregisterAppSw();
    return;
  }
  const hadController = !!navigator.serviceWorker.controller;
  let shown = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || shown) return;
    shown = true;
    toast("Update available", {
      description: "A new version of Habit Tracker is ready.",
      action: { label: "Refresh", onClick: () => window.location.reload() },
      duration: Infinity,
    });
  });
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
    setInterval(() => void reg.update(), 60 * 60 * 1000);
  }).catch(() => undefined);
}
