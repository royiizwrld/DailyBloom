import { useEffect, useState } from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const PALETTES = [
  "sunrise", "ocean", "forest", "citrus", "rose", "lagoon", "plum", "ember", "glacier", "graphite", "mint", "sunflower",
] as const;
type PaletteName = (typeof PALETTES)[number];

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);var p=localStorage.getItem('palette');if(p&&p!=='sunrise')document.documentElement.dataset["palette"]=p;}catch(e){}})();`;

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return (
    <div className="flex items-center">
      <PalettePicker />
      <Button variant="ghost" size="icon" onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
        {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
    </div>
  );
}

function PalettePicker() {
  const [current, setCurrent] = useState<PaletteName>("sunrise");
  useEffect(() => setCurrent((document.documentElement.dataset["palette"] as PaletteName) || "sunrise"), []);
  const pick = (p: PaletteName) => {
    setCurrent(p);
    if (p === "sunrise") delete document.documentElement.dataset["palette"];
    else document.documentElement.dataset["palette"] = p;
    localStorage.setItem("palette", p);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Choose color theme"><Palette className="size-5" /></Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 rounded-2xl p-3">
        <div className="mb-2 px-1 text-sm font-semibold">Theme</div>
        <div className="grid grid-cols-2 gap-2">
          {PALETTES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pick(p)}
              className={cn("flex items-center gap-2.5 rounded-full border px-2 py-1.5 text-sm capitalize transition-colors hover:bg-accent", current === p && "border-primary ring-2 ring-primary/40")}
            >
              <span data-swatch={p} className="flex size-7 shrink-0 items-center justify-center rounded-full">
                {current === p && <Check className="size-4 text-primary-foreground" />}
              </span>
              {p}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
