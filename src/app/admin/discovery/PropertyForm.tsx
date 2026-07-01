"use client";

import { useActionState } from "react";
import { savePropertyAction, type ProfileFormState } from "./actions";
import { RADIUS_OPTIONS_KM, type PropertyProfile } from "@/lib/discovery/types";

const initialState: ProfileFormState = {};

const categoryOptions: { value: PropertyProfile["category"]; label: string }[] = [
  { value: "hotel", label: "Hotel" },
  { value: "guesthouse", label: "Pensiune" },
  { value: "villa", label: "Vilă" },
  { value: "apartment", label: "Apartament" },
  { value: "resort", label: "Resort" },
  { value: "chain", label: "Lanț hotelier" },
];

export function PropertyForm({ profile }: { profile: PropertyProfile }) {
  const [state, formAction, pending] = useActionState(savePropertyAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-sm border border-platinum/10 bg-graphite/40 p-6">
      <h2 className="font-display text-xl text-ivory">Profilul proprietății</h2>
      <p className="text-sm text-stone">Nume, adresă, GPS și categorie — restul se construiește automat.</p>

      {state.error && <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{state.error}</p>}
      {state.info && <p className="rounded-sm border border-emerald/40 bg-emerald/10 px-4 py-3 text-sm text-emerald">{state.info}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nume proprietate" name="name" defaultValue={profile.name} error={state.fieldErrors?.name} required />
        <label className="block text-sm text-ivory">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">Categorie</span>
          <select name="category" defaultValue={profile.category} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60">
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <Field label="Adresă" name="address" defaultValue={profile.address} error={state.fieldErrors?.address} required />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Latitudine" name="lat" type="number" step="0.000001" defaultValue={profile.lat} required />
        <Field label="Longitudine" name="lng" type="number" step="0.000001" defaultValue={profile.lng} required />
        <label className="block text-sm text-ivory">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">Rază de descoperire</span>
          <select name="discoveryRadiusKm" defaultValue={profile.discoveryRadiusKm} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60">
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        </label>
      </div>

      {(profile.locality || profile.county || profile.country) && (
        <p className="text-xs text-stone">
          Zonă detectată: {[profile.locality, profile.county, profile.region, profile.country].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-5 py-2.5 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
          {pending ? "Se salvează…" : "Salvează profilul"}
        </button>
        <button type="submit" name="geocode" value="1" disabled={pending} className="rounded-sm border border-platinum/30 px-5 py-2.5 text-sm text-ivory hover:border-champagne hover:text-champagne disabled:opacity-50">
          Salvează + geocodează adresa
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, error, ...props }: { label: string; name: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <input name={name} {...props} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}
