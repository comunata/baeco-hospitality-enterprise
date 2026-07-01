"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import type { Booking } from "@/lib/types";

export function BookingDetailClient({ booking, dict, canCancelFree }: { booking: Booking; dict: Dictionary; canCancelFree: boolean }) {
  const router = useRouter();
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests ?? "");
  const [checkedIn, setCheckedIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function saveRequests() {
    setSaving(true);
    try {
      await fetch(`/api/portal/bookings/${booking.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "special_requests", specialRequests }),
      });
      setSavedMessage(dict.forms.thankYou);
    } finally {
      setSaving(false);
    }
  }

  async function cancel() {
    if (!confirm(dict.booking.cancelBooking + "?")) return;
    setCancelling(true);
    try {
      await fetch(`/api/portal/bookings/${booking.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      router.refresh();
    } finally {
      setCancelling(false);
    }
  }

  const fieldClass =
    "w-full rounded-sm border border-platinum/20 bg-graphite px-4 py-3 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none";

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-xl text-ivory">{dict.portal.onlineCheckIn}</h2>
        <label className="mt-4 flex items-center gap-3 text-sm text-ivory">
          <input type="checkbox" checked={checkedIn} onChange={(e) => setCheckedIn(e.target.checked)} className="h-4 w-4 accent-[#D6B36A]" />
          {checkedIn ? "Documentele au fost trimise ✓" : "Confirm că voi trimite documentele de identitate înainte de sosire"}
        </label>
      </div>

      <div>
        <h2 className="font-display text-xl text-ivory">{dict.portal.specialRequests}</h2>
        <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={4} className={`${fieldClass} mt-4`} />
        <button onClick={saveRequests} disabled={saving} className="mt-3 rounded-sm bg-champagne px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-midnight disabled:opacity-50">
          {saving ? dict.common.loading : dict.common.save}
        </button>
        {savedMessage && <p className="mt-2 text-xs text-emerald">{savedMessage}</p>}
      </div>

      {booking.status !== "cancelled" && (
        <div>
          <h2 className="font-display text-xl text-ivory">{dict.booking.cancelPolicy}</h2>
          <p className="mt-2 text-sm text-stone">
            {canCancelFree ? "Poți anula gratuit până cu 5 zile înainte de sosire." : "Termenul de anulare gratuită a expirat; se reține contravaloarea primei nopți."}
          </p>
          <button onClick={cancel} disabled={cancelling} className="mt-4 rounded-sm border border-red-400/40 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-red-400 hover:bg-red-400/10 disabled:opacity-50">
            {cancelling ? dict.common.loading : dict.booking.cancelBooking}
          </button>
        </div>
      )}
    </div>
  );
}
