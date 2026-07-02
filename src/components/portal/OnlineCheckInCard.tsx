"use client";

import { useActionState } from "react";
import { onlineCheckInAction, type CheckInFormState } from "@/app/portal/bookings/[code]/checkin-actions";
import type { Booking } from "@/lib/types";

const initialState: CheckInFormState = {};

export function OnlineCheckInCard({ booking, locale }: { booking: Booking; locale: string }) {
  const [state, formAction, pending] = useActionState(onlineCheckInAction, initialState);
  const isRo = locale === "ro";

  if (booking.checkedInAt || state.done) {
    return (
      <div className="rounded-sm border border-emerald/30 bg-emerald/10 p-6">
        <p className="font-display text-lg text-emerald">{isRo ? "Check-in online efectuat" : "Online check-in completed"}</p>
        {booking.arrivalTime && (
          <p className="mt-1 text-sm text-stone">
            {isRo ? "Sosire estimată" : "Estimated arrival"}: {booking.arrivalTime}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-sm border border-champagne/25 bg-graphite/60 p-6">
      <p className="font-display text-lg text-ivory">{isRo ? "Check-in online" : "Online check-in"}</p>
      <p className="mt-1 text-sm text-stone">
        {isRo
          ? "Spune-ne când ajungi și pregătim totul înainte de sosire."
          : "Tell us when you arrive and we'll have everything ready."}
      </p>

      {state.error && <p className="mt-3 rounded-sm border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">{state.error}</p>}

      <input type="hidden" name="code" value={booking.code} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm text-ivory">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{isRo ? "Ora estimată a sosirii" : "Estimated arrival time"}</span>
          <input name="arrivalTime" type="time" required className="w-full rounded-sm border border-platinum/20 bg-midnight px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
        </label>
        <label className="block text-sm text-ivory sm:col-span-2">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{isRo ? "Observații (opțional)" : "Notes (optional)"}</span>
          <textarea name="notes" rows={2} className="w-full rounded-sm border border-platinum/20 bg-midnight px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
        </label>
      </div>
      <button type="submit" disabled={pending} className="mt-4 rounded-sm bg-champagne px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-midnight disabled:opacity-50">
        {pending ? "…" : isRo ? "Finalizează check-in-ul" : "Complete check-in"}
      </button>
    </form>
  );
}
