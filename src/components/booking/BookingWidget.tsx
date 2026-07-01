"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export function BookingWidget({ locale, dict, floating = false }: { locale: Locale; dict: Dictionary; floating?: boolean }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [promoCode, setPromoCode] = useState("");

  function submit() {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
      ...(promoCode ? { promo: promoCode } : {}),
    });
    router.push(`/${locale}/booking?${params.toString()}`);
  }

  const fieldClass =
    "w-full border-0 border-b border-platinum/30 bg-transparent px-0 py-2 text-sm text-ivory focus:border-champagne focus:outline-none focus:ring-0";
  const labelClass = "mb-1 block text-[11px] font-medium uppercase tracking-[0.15em] text-stone";

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-6 rounded-sm border border-platinum/15 bg-graphite/95 p-6 backdrop-blur md:grid-cols-6 md:gap-4 md:p-8",
        floating && "shadow-2xl"
      )}
    >
      <div className="col-span-2 md:col-span-2">
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          minDate={today()}
          locale={locale}
          checkInLabel={dict.bookingWidget.checkIn}
          checkOutLabel={dict.bookingWidget.checkOut}
          onChange={({ checkIn: ci, checkOut: co }) => {
            setCheckIn(ci);
            setCheckOut(co);
          }}
        />
      </div>
      <div className="col-span-1">
        <label className={labelClass}>{dict.bookingWidget.adults}</label>
        <input
          type="text"
          inputMode="numeric"
          value={String(adults)}
          onChange={(e) => {
            const parsed = Number.parseInt(e.target.value.replace(/^0+(?=\d)/, ""), 10);
            setAdults(Number.isNaN(parsed) ? 1 : Math.min(12, Math.max(1, parsed)));
          }}
          className={fieldClass}
        />
      </div>
      <div className="col-span-1">
        <label className={labelClass}>{dict.bookingWidget.children}</label>
        <input
          type="text"
          inputMode="numeric"
          value={String(children)}
          onChange={(e) => {
            const parsed = Number.parseInt(e.target.value.replace(/^0+(?=\d)/, ""), 10);
            setChildren(Number.isNaN(parsed) ? 0 : Math.min(8, Math.max(0, parsed)));
          }}
          className={fieldClass}
        />
      </div>
      <div className="col-span-1">
        <label className={labelClass}>{dict.bookingWidget.promoCode}</label>
        <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className={fieldClass} placeholder={dict.common.optional} />
      </div>
      <div className="col-span-2 flex items-end md:col-span-1">
        <button
          onClick={submit}
          className="w-full rounded-sm bg-champagne px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-midnight transition-colors hover:bg-champagne/90"
        >
          {dict.bookingWidget.submit}
        </button>
      </div>
    </div>
  );
}
