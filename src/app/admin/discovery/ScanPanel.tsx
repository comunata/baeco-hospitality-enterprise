"use client";

import { useActionState } from "react";
import { runScanAction, type ScanFormState } from "./actions";
import { BD_CATEGORIES, CATEGORY_LABELS, RADIUS_OPTIONS_KM } from "@/lib/discovery/types";

const initialState: ScanFormState = {};

export function ScanPanel({ defaultRadiusKm }: { defaultRadiusKm: number }) {
  const [state, formAction, pending] = useActionState(runScanAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-sm border border-champagne/20 bg-gradient-to-br from-graphite via-midnight to-graphite p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ivory">Scanare zonă</h2>
          <p className="mt-1 text-sm text-stone">Descoperă automat locurile din jurul proprietății (OpenStreetMap).</p>
        </div>
        <label className="text-sm text-ivory">
          <span className="mr-2 text-[11px] uppercase tracking-wider text-stone">Rază</span>
          <select name="radiusKm" defaultValue={defaultRadiusKm} className="rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60">
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        </label>
      </div>

      {state.error && <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{state.error}</p>}
      {state.summary && <p className="rounded-sm border border-emerald/40 bg-emerald/10 px-4 py-3 text-sm text-emerald">{state.summary}</p>}

      <details className="text-sm text-stone">
        <summary className="cursor-pointer text-xs uppercase tracking-wider text-champagne">Categorii (implicit: toate)</summary>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {BD_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2 text-xs text-ivory">
              <input type="checkbox" name="categories" value={category} className="h-3.5 w-3.5 rounded-sm border-platinum/30 bg-graphite" />
              {CATEGORY_LABELS[category].ro}
            </label>
          ))}
        </div>
      </details>

      <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-midnight hover:opacity-90 disabled:opacity-50">
        {pending ? "Se scanează…" : "Pornește scanarea"}
      </button>
    </form>
  );
}
