"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
  minDate?: string;
  checkInLabel: string;
  checkOutLabel: string;
  locale?: string;
  className?: string;
}

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

const sameDay = (a: Date, b: Date) => toISO(a) === toISO(b);

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildMonthGrid(monthDate: Date) {
  const first = startOfMonth(monthDate);
  const startWeekday = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Premium custom date-range picker (check-in / check-out) built with Tailwind only.
 * No external calendar dependency — used consistently across BookingWidget,
 * BookingFlow and RoomFinderChat.
 */
export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  minDate,
  checkInLabel,
  checkOutLabel,
  locale = "ro",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<"checkIn" | "checkOut">("checkIn");
  const containerRef = useRef<HTMLDivElement>(null);

  const checkInDate = useMemo(() => fromISO(checkIn), [checkIn]);
  const checkOutDate = useMemo(() => fromISO(checkOut), [checkOut]);
  const min = useMemo(() => (minDate ? fromISO(minDate) : new Date(new Date().setHours(0, 0, 0, 0))), [minDate]);

  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(checkInDate));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const monthLabel = visibleMonth.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const weekdayLabels =
    locale === "ro" ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];

  function pickDay(day: Date) {
    if (day < min) return;
    if (selecting === "checkIn") {
      const nextCheckOut = day >= checkOutDate ? toISO(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) : checkOut;
      onChange({ checkIn: toISO(day), checkOut: nextCheckOut });
      setSelecting("checkOut");
    } else {
      if (day <= checkInDate) {
        onChange({ checkIn: toISO(day), checkOut: checkOut });
        setSelecting("checkOut");
        return;
      }
      onChange({ checkIn, checkOut: toISO(day) });
      setOpen(false);
      setSelecting("checkIn");
    }
  }

  const grid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => {
            setSelecting("checkIn");
            setOpen(true);
          }}
          className="w-full rounded-sm border border-platinum/20 bg-graphite px-4 py-3 text-left text-sm text-ivory transition-colors hover:border-champagne/50 focus:border-champagne focus:outline-none"
        >
          <span className="block text-[11px] font-medium uppercase tracking-[0.15em] text-stone">{checkInLabel}</span>
          <span className="mt-1 block">{checkInDate.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelecting("checkOut");
            setOpen(true);
          }}
          className="w-full rounded-sm border border-platinum/20 bg-graphite px-4 py-3 text-left text-sm text-ivory transition-colors hover:border-champagne/50 focus:border-champagne focus:outline-none"
        >
          <span className="block text-[11px] font-medium uppercase tracking-[0.15em] text-stone">{checkOutLabel}</span>
          <span className="mt-1 block">{checkOutDate.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-sm border border-platinum/15 bg-graphite p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
              className="rounded-sm px-2 py-1 text-stone hover:text-champagne"
              aria-label="previous month"
            >
              ‹
            </button>
            <p className="font-display text-sm capitalize text-ivory">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              className="rounded-sm px-2 py-1 text-stone hover:text-champagne"
              aria-label="next month"
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-stone">
            {weekdayLabels.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.map((day, i) => {
              if (!day) return <span key={i} />;
              const disabled = day < min;
              const isCheckIn = sameDay(day, checkInDate);
              const isCheckOut = sameDay(day, checkOutDate);
              const inRange = day > checkInDate && day < checkOutDate;
              return (
                <button
                  type="button"
                  key={i}
                  disabled={disabled}
                  onClick={() => pickDay(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-sm text-xs transition-colors",
                    disabled && "cursor-not-allowed text-stone/30",
                    !disabled && !isCheckIn && !isCheckOut && !inRange && "text-ivory hover:bg-champagne/10",
                    inRange && "bg-champagne/15 text-ivory",
                    (isCheckIn || isCheckOut) && "bg-champagne text-midnight font-medium"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
