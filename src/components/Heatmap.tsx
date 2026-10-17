import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isAfter, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LEVEL = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];

export function levelFor(v: number | null) {
  if (v === null) return null;
  if (v === 0) return 0;
  if (v < 0.34) return 1;
  if (v < 0.67) return 2;
  if (v < 1) return 3;
  return 4;
}

export function Heatmap({
  month,
  onMonthChange,
  valueFor,
  today,
  onDayClick,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  valueFor: (d: Date) => number | null;
  today: Date;
  onDayClick?: (d: Date) => void;
}) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const lead = (getDay(days[0]) + 6) % 7;
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Previous month">
          <ChevronLeft />
        </Button>
        <span className="font-display font-semibold">{format(month, "MMMM yyyy")}</span>
        <Button
          variant="ghost"
          size="icon"
          disabled={isAfter(startOfMonth(addMonths(month, 1)), today)}
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="Next month"
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`l${i}`} />
        ))}
        {days.map((d) => {
          const future = isAfter(d, today);
          const v = future ? null : valueFor(d);
          const lvl = levelFor(v);
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={future || !onDayClick}
              onClick={() => onDayClick?.(d)}
              title={`${format(d, "MMM d")}: ${v === null ? "nothing due" : `${Math.round(v * 100)}%`}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-xs font-medium",
                lvl === null ? "border border-dashed text-muted-foreground/60" : LEVEL[lvl],
                lvl !== null && lvl >= 3 && "text-primary-foreground",
                future && "opacity-40",
              )}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
        Less {LEVEL.map((c) => <span key={c} className={cn("size-3 rounded", c)} />)} More
      </div>
    </div>
  );
}
