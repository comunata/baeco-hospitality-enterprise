"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveSeasonAction, type SeasonFormState } from "./actions";
import type { Season } from "@/lib/types";

const initialState: SeasonFormState = {};

export function SeasonForm({ season }: { season?: Season }) {
  const [state, formAction, pending] = useActionState(saveSeasonAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {season?.id && <input type="hidden" name="id" value={season.id} />}

      {state.error && (
        <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{state.error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nume sezon (RO)" name="nameRo" defaultValue={season?.name.ro} error={state.fieldErrors?.nameRo} required />
        <Field label="Nume sezon (EN)" name="nameEn" defaultValue={season?.name.en} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data început" name="startDate" type="date" defaultValue={season?.startDate} error={state.fieldErrors?.startDate} required />
        <Field label="Data sfârșit" name="endDate" type="date" defaultValue={season?.endDate} error={state.fieldErrors?.endDate} required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Multiplicator preț" name="multiplier" type="number" step="0.01" min={0.1} defaultValue={season?.multiplier ?? 1} required />
        <Field label="Multiplicator weekend" name="weekendMultiplier" type="number" step="0.01" min={0.1} defaultValue={season?.weekendMultiplier ?? 1} required />
        <Field label="Minim nopți" name="minNights" type="number" min={1} defaultValue={season?.minNights ?? 1} required />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-6 py-2.5 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
          {pending ? "Se salvează…" : "Salvează sezonul"}
        </button>
        <Link href="/admin/seasons" className="rounded-sm border border-platinum/20 px-6 py-2.5 text-sm text-ivory hover:bg-platinum/5">
          Anulează
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  ...rest
}: { label: string; name: string; defaultValue?: string | number; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60"
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}
