"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import type { Room, ExtraService, PriceBreakdown } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

type Step = "room" | "details" | "confirmed";

interface ConfirmResult {
  code: string;
  whatsappLink: string;
}

export function BookingFlow({ locale, dict, rooms, services }: { locale: Locale; dict: Dictionary; rooms: Room[]; services: ExtraService[] }) {
  const searchParams = useSearchParams();

  const [checkIn, setCheckIn] = useState(() => searchParams.get("checkIn") ?? new Date().toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(
    () => searchParams.get("checkOut") ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [adults, setAdults] = useState(Number(searchParams.get("adults") ?? 2));
  const [children, setChildren] = useState(Number(searchParams.get("children") ?? 0));
  const [childAges, setChildAges] = useState<number[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(
    rooms.find((r) => r.slug === searchParams.get("room")) ?? null
  );
  const [step, setStep] = useState<Step>(selectedRoom ? "details" : "room");

  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState(searchParams.get("promo") ?? "");
  const [voucherCode, setVoucherCode] = useState("");
  const [guest, setGuest] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [specialRequests, setSpecialRequests] = useState("");

  const [quote, setQuote] = useState<PriceBreakdown | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);

  const eligibleRooms = useMemo(
    () => rooms.filter((r) => r.maxAdults >= adults && r.maxChildren >= children),
    [rooms, adults, children]
  );

  const selectedExtras = useMemo(
    () => Object.entries(extraQuantities).filter(([, qty]) => qty > 0).map(([serviceId, quantity]) => ({ serviceId, quantity })),
    [extraQuantities]
  );

  const datesInvalid = useMemo(() => Boolean(selectedRoom) && new Date(checkOut) <= new Date(checkIn), [selectedRoom, checkIn, checkOut]);

  useEffect(() => {
    if (!selectedRoom || datesInvalid) return;
    const timeout = setTimeout(() => {
      setQuoting(true);
      setQuoteError(null);
      fetch("/api/booking/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomSlug: selectedRoom.slug,
          checkIn,
          checkOut,
          adults,
          children,
          childAges,
          extras: selectedExtras,
          promoCode: promoCode || undefined,
          voucherCode: voucherCode || undefined,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "quote_failed");
          setQuote(data.breakdown);
        })
        .catch(() => {
          setQuote(null);
          setQuoteError(dict.errors.generic);
        })
        .finally(() => setQuoting(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [selectedRoom, datesInvalid, checkIn, checkOut, adults, children, childAges, selectedExtras, promoCode, voucherCode, dict]);

  async function confirmBooking() {
    if (!selectedRoom) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomSlug: selectedRoom.slug,
          checkIn,
          checkOut,
          adults,
          children,
          childAges,
          extras: selectedExtras,
          promoCode: promoCode || undefined,
          voucherCode: voucherCode || undefined,
          guest,
          specialRequests,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "booking_failed");
      setResult({ code: data.booking.code, whatsappLink: data.whatsappLink });
      setStep("confirmed");
    } catch {
      setSubmitError(dict.errors.roomUnavailable);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-sm border border-platinum/20 bg-graphite px-4 py-3 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none";
  const labelClass = "mb-1 block text-[11px] font-medium uppercase tracking-[0.15em] text-stone";

  if (step === "confirmed" && result) {
    return (
      <Card className="mx-auto max-w-xl p-10 text-center">
        <p className="font-display text-3xl text-champagne">{dict.booking.bookingConfirmed}</p>
        <p className="mt-4 text-sm text-stone">{dict.booking.bookingConfirmedText}</p>
        <p className="mt-6 rounded-sm border border-platinum/15 bg-midnight px-4 py-3 font-mono text-lg text-ivory">{result.code}</p>
        <a
          href={result.whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-sm border border-emerald/40 px-6 py-3 text-xs font-medium uppercase tracking-widest text-emerald hover:bg-emerald/10"
        >
          WhatsApp
        </a>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
      <div className="md:col-span-2">
        <div className="mb-8 grid grid-cols-2 gap-4 rounded-sm border border-platinum/10 bg-graphite/50 p-6 sm:grid-cols-4">
          <div className="col-span-2">
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              locale={locale}
              checkInLabel={dict.bookingWidget.checkIn}
              checkOutLabel={dict.bookingWidget.checkOut}
              onChange={({ checkIn: ci, checkOut: co }) => {
                setCheckIn(ci);
                setCheckOut(co);
              }}
            />
          </div>
          <div>
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
          <div>
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
          {Array.from({ length: children }).map((_, i) => (
            <div key={i}>
              <label className={labelClass}>{dict.bookingWidget.childAge} {i + 1}</label>
              <input
                type="text"
                inputMode="numeric"
                value={String(childAges[i] ?? 0)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/^0+(?=\d)/, "");
                  const parsed = Number.parseInt(raw, 10);
                  const clamped = Number.isNaN(parsed) ? 0 : Math.min(17, Math.max(0, parsed));
                  const next = [...childAges];
                  next[i] = clamped;
                  setChildAges(next);
                }}
                className={fieldClass}
              />
            </div>
          ))}
        </div>

        {step === "room" && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {eligibleRooms.length === 0 && <p className="text-sm text-stone">{dict.rooms.noRooms}</p>}
            {eligibleRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => {
                  setSelectedRoom(room);
                  setStep("details");
                }}
                className="text-left"
              >
                <Card className="overflow-hidden transition-colors hover:border-champagne/50">
                  <div className="relative aspect-[4/3]">
                    <Image src={room.coverImage} alt={room.name[locale] ?? room.name.en} fill sizes="50vw" className="object-cover" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl text-ivory">{room.name[locale] ?? room.name.en}</h3>
                    <p className="mt-2 font-display text-lg text-champagne">
                      {formatCurrency(room.basePrice)} <span className="text-xs text-stone">{dict.common.perNight}</span>
                    </p>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}

        {step === "details" && selectedRoom && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ivory">{selectedRoom.name[locale] ?? selectedRoom.name.en}</h2>
              <button onClick={() => setStep("room")} className="text-xs uppercase tracking-widest text-champagne underline">
                {dict.booking.selectRoom}
              </button>
            </div>

            <div>
              <h3 className="font-display text-xl text-ivory">{dict.booking.extraServices}</h3>
              <div className="mt-4 space-y-3">
                {services
                  .filter((s) => [...selectedRoom.includedServiceIds, ...selectedRoom.extraServiceIds].includes(s.id))
                  .map((service) => {
                    const included = selectedRoom.includedServiceIds.includes(service.id);
                    const qty = extraQuantities[service.id] ?? 0;
                    return (
                      <label key={service.id} className={cn("flex items-center justify-between border-b border-platinum/10 pb-3", included && "opacity-50")}>
                        <span className="flex items-center gap-3 text-sm text-ivory">
                          <input
                            type="checkbox"
                            disabled={included}
                            checked={included || qty > 0}
                            onChange={(e) => setExtraQuantities((prev) => ({ ...prev, [service.id]: e.target.checked ? 1 : 0 }))}
                            className="h-4 w-4 accent-[#D6B36A]"
                          />
                          {service.name[locale] ?? service.name.en} {included && `(${dict.common.active.toLowerCase()})`}
                        </span>
                        <span className="text-xs text-stone">{included ? "—" : formatCurrency(service.price)}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl text-ivory">{dict.booking.guestDetails}</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input placeholder={dict.booking.firstName} value={guest.firstName} onChange={(e) => setGuest({ ...guest, firstName: e.target.value })} className={fieldClass} />
                <input placeholder={dict.booking.lastName} value={guest.lastName} onChange={(e) => setGuest({ ...guest, lastName: e.target.value })} className={fieldClass} />
                <input type="email" placeholder={dict.booking.email} value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} className={fieldClass} />
                <input placeholder={dict.booking.phone} value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} className={fieldClass} />
                <textarea
                  placeholder={dict.booking.specialRequests}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className={cn(fieldClass, "sm:col-span-2")}
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{dict.common.promoCode}</label>
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>{dict.common.giftVoucher}</label>
                <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} className={fieldClass} />
              </div>
            </div>
          </div>
        )}
      </div>

      {step === "details" && selectedRoom && (
        <aside>
          <div className="sticky top-28 rounded-sm border border-platinum/15 bg-graphite p-6">
            <h3 className="font-display text-xl text-ivory">{dict.booking.summary}</h3>
            {(datesInvalid || quoteError) && <p className="mt-4 text-sm text-red-400">{datesInvalid ? dict.errors.invalidDates : quoteError}</p>}
            {quote && (
              <div className="mt-4 space-y-2 text-sm">
                {quote.lines.map((line, i) => (
                  <div key={i} className="flex justify-between text-stone">
                    <span>{line.label}</span>
                    <span className={line.amount < 0 ? "text-emerald" : "text-ivory"}>{formatCurrency(line.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-platinum/10 pt-3 font-display text-lg text-champagne">
                  <span>{dict.common.total}</span>
                  <span>{formatCurrency(quote.total, quote.currency)}</span>
                </div>
              </div>
            )}
            {quoting && <p className="mt-4 text-xs text-stone">{dict.common.loading}</p>}

            <button
              onClick={confirmBooking}
              disabled={submitting || !quote || !guest.firstName || !guest.email}
              className="mt-6 w-full rounded-sm bg-champagne px-6 py-3.5 text-xs font-medium uppercase tracking-[0.15em] text-midnight disabled:opacity-50"
            >
              {submitting ? dict.common.loading : dict.booking.confirmBooking}
            </button>
            {submitError && <p className="mt-3 text-xs text-red-400">{submitError}</p>}
          </div>
        </aside>
      )}
    </div>
  );
}
