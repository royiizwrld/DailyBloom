import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export const PALETTES = [
  "sunrise", "ocean", "forest", "citrus", "rose", "lagoon", "plum", "ember", "glacier", "graphite", "mint", "sunflower",
] as const;
type PaletteName = (typeof PALETTES)[number];
type Mode = "light" | "dark" | "system";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=(t==='dark'||t==='light')?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);var p=localStorage.getItem('palette');if(p&&p!=='sunrise')document.documentElement.dataset["palette"]=p;}catch(e){}})();`;

function applyMode(m: Mode) {
  const dark = m === "system" ? matchMedia("(prefers-color-scheme: dark)").matches : m === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

export function ModePicker() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    const t = localStorage.getItem("theme");
    setMode(t === "dark" || t === "light" ? t : "system");
  }, []);
  useEffect(() => {
    if (mode !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyMode("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [mode]);
  const pick = (m: Mode) => {
    setMode(m);
    localStorage.setItem("theme", m);
    applyMode(m);
  };
  const opts = [
    { v: "light" as const, label: "Light", icon: Sun },
    { v: "dark" as const, label: "Dark", icon: Moon },
    { v: "system" as const, label: "System", icon: Monitor },
  ];
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Appearance">
      {opts.map(({ v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={mode === v}
          onClick={() => pick(v)}
          className={cn("flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition-colors hover:bg-accent", mode === v && "border-primary ring-2 ring-primary/40")}
        >
          <Icon className="size-6" /> {label}
        </button>
      ))}
    </div>
  );
}

export function PalettePicker() {
  const [current, setCurrent] = useState<PaletteName>("sunrise");
  useEffect(() => setCurrent((document.documentElement.dataset["palette"] as PaletteName) || "sunrise"), []);
  const pick = (p: PaletteName) => {
    setCurrent(p);
    if (p === "sunrise") delete document.documentElement.dataset["palette"];
    else document.documentElement.dataset["palette"] = p;
    localStorage.setItem("palette", p);
  };
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {PALETTES.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={current === p}
          onClick={() => pick(p)}
          className={cn("flex items-center gap-2.5 rounded-full border px-2 py-1.5 text-sm capitalize transition-colors hover:bg-accent", current === p && "border-primary ring-2 ring-primary/40")}
        >
          <span data-swatch={p} className="flex size-8 shrink-0 items-center justify-center rounded-full">
            {current === p && <Check className="size-4 text-primary-foreground" />}
          </span>
          {p}
        </button>
      ))}
    </div>
  );
}
