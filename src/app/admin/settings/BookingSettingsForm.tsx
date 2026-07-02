"use client";

import { useActionState } from "react";
import { saveBookingSettingsAction, type BookingSettingsFormState } from "./actions";
import type { BookingSettings } from "@/lib/data/settings";

const initialState: BookingSettingsFormState = {};

export function BookingSettingsForm({ settings }: { settings: BookingSettings }) {
  const [state, formAction, pending] = useActionState(saveBookingSettingsAction, initialState);

  const fieldClass =
    "w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-sm text-ivory outline-none focus:border-champagne/60";
  const labelClass = "mb-1 block text-[11px] uppercase tracking-wider text-stone";

  return (
    <form action={formAction} className="space-y-4 rounded-sm border border-platinum/10 bg-graphite/60 p-6">
      <h2 className="font-display text-xl text-ivory">Politici & taxe rezervări</h2>

      {state.error && <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm text-red-300">{state.error}</p>}
      {state.saved && <p className="rounded-sm border border-emerald/40 bg-emerald/10 px-4 py-2 text-sm text-emerald">Setări salvate.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Taxă turistică (EUR / adult / noapte)</span>
          <input name="touristTaxPerPersonPerNight" type="number" step="0.1" min={0} defaultValue={settings.touristTaxPerPersonPerNight} className={fieldClass} />
        </label>
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Anulare gratuită (zile înainte de check-in)</span>
          <input name="cancellationMinDaysBefore" type="number" min={0} defaultValue={settings.cancellationMinDaysBefore} className={fieldClass} />
        </label>
      </div>

      <label className="block text-sm text-ivory">
        <span className={labelClass}>Politică de anulare (RO)</span>
        <textarea name="cancellationPolicyRo" rows={2} defaultValue={settings.cancellationPolicy.ro} className={fieldClass} />
      </label>
      <label className="block text-sm text-ivory">
        <span className={labelClass}>Cancellation policy (EN)</span>
        <textarea name="cancellationPolicyEn" rows={2} defaultValue={settings.cancellationPolicy.en} className={fieldClass} />
      </label>

      <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-5 py-2.5 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
        {pending ? "Se salvează…" : "Salvează setările"}
      </button>
    </form>
  );
}
