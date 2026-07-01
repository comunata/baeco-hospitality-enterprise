"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveAttractionAction, type AttractionFormState } from "./actions";
import type { Attraction } from "@/lib/types";

const initialState: AttractionFormState = {};

const categoryOptions: { value: Attraction["category"]; label: string }[] = [
  { value: "attraction", label: "Atracție" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafenea" },
  { value: "market", label: "Piață" },
  { value: "shop", label: "Magazin" },
  { value: "producer", label: "Producător local" },
];

const goodForOptions: { value: string; label: string }[] = [
  { value: "family", label: "Familie" },
  { value: "romantic", label: "Romantic" },
  { value: "rainy-day", label: "Zi ploioasă" },
  { value: "kids", label: "Copii" },
];

export function AttractionForm({ attraction, backHref, defaultCategory }: { attraction?: Attraction; backHref: string; defaultCategory?: Attraction["category"] }) {
  const [state, formAction, pending] = useActionState(saveAttractionAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {attraction?.id && <input type="hidden" name="id" value={attraction.id} />}
      <input type="hidden" name="redirectTo" value={backHref} />

      {state.error && <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{state.error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nume (RO)" name="nameRo" defaultValue={attraction?.name.ro} error={state.fieldErrors?.nameRo} required />
        <Field label="Nume (EN)" name="nameEn" defaultValue={attraction?.name.en} />
      </div>

      <TextArea label="Descriere (RO)" name="descriptionRo" defaultValue={attraction?.description.ro} />
      <TextArea label="Descriere (EN)" name="descriptionEn" defaultValue={attraction?.description.en} />

      <label className="block text-sm text-ivory">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">Categorie</span>
        <select
          name="category"
          defaultValue={attraction?.category ?? defaultCategory ?? "attraction"}
          className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <Field label="URL imagine (opțional)" name="image" defaultValue={attraction?.image} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Distanță (km)" name="distanceKm" type="number" step="0.1" min={0} defaultValue={attraction?.distanceKm ?? 1} required />
        <Field label="Timp cu mașina (minute)" name="driveMinutes" type="number" min={0} defaultValue={attraction?.driveMinutes ?? 5} required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Latitudine" name="lat" type="number" step="0.000001" defaultValue={attraction?.lat ?? 0} required />
        <Field label="Longitudine" name="lng" type="number" step="0.000001" defaultValue={attraction?.lng ?? 0} required />
      </div>

      <Field label="Etichete (separate prin virgulă)" name="tags" defaultValue={attraction?.tags.join(", ")} placeholder="local, tradițional, în aer liber" />

      <fieldset>
        <legend className="mb-2 text-[11px] uppercase tracking-wider text-stone">Potrivit pentru</legend>
        <div className="flex flex-wrap gap-4">
          {goodForOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-ivory">
              <input type="checkbox" name="goodFor" value={opt.value} defaultChecked={attraction?.goodFor.includes(opt.value as never)} className="h-4 w-4 rounded-sm border-platinum/30 bg-graphite" />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-6 py-2.5 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
          {pending ? "Se salvează…" : "Salvează"}
        </button>
        <Link href={backHref} className="rounded-sm border border-platinum/20 px-6 py-2.5 text-sm text-ivory hover:bg-platinum/5">
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
      <input name={name} defaultValue={defaultValue} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" {...rest} />
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={3} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
    </label>
  );
}
