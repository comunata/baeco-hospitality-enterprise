"use client";

import { useTransition } from "react";
import { setBookingStatusAction } from "./actions";
import type { BookingStatus } from "@/lib/types";

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "În așteptare" },
  { value: "confirmed", label: "Confirmată" },
  { value: "completed", label: "Finalizată" },
  { value: "cancelled", label: "Anulată" },
];

export function StatusSelect({ code, status }: { code: string; status: BookingStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => startTransition(() => setBookingStatusAction(code, e.target.value as BookingStatus))}
      className="rounded-sm border border-platinum/20 bg-graphite/60 px-2 py-1.5 text-xs text-ivory outline-none focus:border-champagne/60 disabled:opacity-50"
    >
      {statusOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
