"use client";

import { useState, useTransition } from "react";
import { setRateOverrideAction } from "./actions";
import { formatCurrency } from "@/lib/utils";

export function RateCell({
  roomId,
  seasonId,
  computedPrice,
  computedWeekendPrice,
  overridePrice,
}: {
  roomId: string;
  seasonId: string;
  computedPrice: number;
  computedWeekendPrice: number;
  overridePrice: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await setRateOverrideAction(formData);
            setEditing(false);
          });
        }}
        className="flex items-center gap-1"
      >
        <input type="hidden" name="roomId" value={roomId} />
        <input type="hidden" name="seasonId" value={seasonId} />
        <input
          name="overridePrice"
          type="number"
          step="0.01"
          min={0}
          defaultValue={overridePrice ?? ""}
          placeholder="auto"
          className="w-20 rounded-sm border border-platinum/20 bg-graphite/60 px-2 py-1 text-xs text-ivory outline-none focus:border-champagne/60"
        />
        <button type="submit" disabled={pending} className="text-xs text-champagne hover:opacity-80 disabled:opacity-50">
          {pending ? "…" : "✓"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-stone hover:text-ivory">
          ✕
        </button>
      </form>
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="text-left hover:opacity-80">
      <span className="text-champagne">{formatCurrency(overridePrice ?? computedPrice)}</span>
      {overridePrice !== null && <span className="ml-1 text-[9px] uppercase text-champagne/70">(fix)</span>}
      <span className="ml-1 text-[10px] text-stone">/ {formatCurrency(overridePrice ? overridePrice : computedWeekendPrice)} weekend</span>
    </button>
  );
}
