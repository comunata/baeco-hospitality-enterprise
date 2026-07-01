import { notFound } from "next/navigation";
import { getServerDictionary } from "@/lib/i18n/server";
import { getPortalSession } from "@/lib/portal/session";
import { getBookingByCode, canCancelFreely } from "@/lib/data/bookings";
import { getRoomBySlug, getRooms } from "@/lib/data/rooms";
import { StatusBadge } from "@/components/admin/AdminTable";
import { BookingDetailClient } from "@/components/portal/BookingDetailClient";
import { UpsellRecommendations } from "@/components/portal/UpsellRecommendations";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PortalBookingDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { dict, locale } = await getServerDictionary();
  const session = await getPortalSession();
  const booking = await getBookingByCode(code);
  // Only the guest owning the booking may view its details/invoice — the
  // portal layout already guarantees `session.authenticated`, but the code
  // in the URL is guessable, so we still enforce email ownership here.
  if (!booking || booking.guest.email.toLowerCase() !== session.email.toLowerCase()) notFound();

  const rooms = await getRooms();
  const room = rooms.find((r) => r.id === booking.roomId) ?? (await getRoomBySlug(booking.roomId));

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-ivory">{dict.portal.stayDetails}</h1>
          <StatusBadge status={booking.status} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6 border-y border-platinum/10 py-6 sm:grid-cols-4">
          <Field label={dict.footer.checkIn} value={formatDate(booking.checkIn)} />
          <Field label={dict.footer.checkOut} value={formatDate(booking.checkOut)} />
          <Field label={dict.common.guests} value={`${booking.guests.adults} + ${booking.guests.children}`} />
          <Field label={dict.common.bookingCode} value={booking.code} />
        </div>
        <p className="mt-6 font-display text-2xl text-champagne">{room?.name.ro}</p>
        <a href={`/api/portal/bookings/${booking.code}/ics`} className="mt-3 inline-block text-xs uppercase tracking-widest text-champagne underline">
          {dict.portal.exportCalendar}
        </a>

        <div className="mt-10">
          <BookingDetailClient booking={booking} dict={dict} canCancelFree={canCancelFreely(booking.checkIn)} />
        </div>

        {booking.status !== "cancelled" && <UpsellRecommendations code={booking.code} locale={locale} dict={dict} />}
      </div>

      <aside>
        <h2 className="font-display text-xl text-ivory">{dict.portal.invoices}</h2>
        <div className="mt-4 rounded-sm border border-platinum/15 bg-graphite p-6 text-sm">
          <Row label={dict.common.accommodationCost} value={formatCurrency(booking.totals.roomSubtotal, booking.totals.currency)} />
          <Row label={dict.common.extraServicesCost} value={formatCurrency(booking.totals.extrasSubtotal, booking.totals.currency)} />
          <Row label={dict.common.discount} value={`- ${formatCurrency(booking.totals.discountAmount, booking.totals.currency)}`} />
          <Row label={dict.common.taxes} value={formatCurrency(booking.totals.taxAmount, booking.totals.currency)} />
          <div className="mt-3 flex justify-between border-t border-platinum/10 pt-3 font-display text-lg text-champagne">
            <span>{dict.common.total}</span>
            <span>{formatCurrency(booking.totals.total, booking.totals.currency)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-stone">{label}</p>
      <p className="mt-1 text-ivory">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-stone">
      <span>{label}</span>
      <span className="text-ivory">{value}</span>
    </div>
  );
}
