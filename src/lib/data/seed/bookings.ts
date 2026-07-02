import type { Booking } from "@/lib/types";

const today = new Date();
const iso = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const seedBookings: Booking[] = [
  {
    id: "seed-booking-1",
    code: "BD-DEMO01",
    roomId: "room-deluxe-garden",
    checkIn: iso(0),
    checkOut: iso(3),
    guests: { adults: 2, children: 0, childAges: [], infants: 0 },
    extras: [{ serviceId: "svc-breakfast", quantity: 1 }],
    guest: { firstName: "Alexandra", lastName: "Marin", email: "alexandra@example.com", phone: "+40711111111" },
    status: "confirmed",
    totals: { nights: 3, roomSubtotal: 391.5, extrasSubtotal: 54, discountAmount: 0, taxAmount: 12, voucherApplied: 0, total: 457.5, lines: [], currency: "EUR" },
    createdAt: iso(-5),
    source: "website",
  },
  {
    id: "seed-booking-2",
    code: "BD-DEMO02",
    roomId: "room-executive-suite",
    checkIn: iso(1),
    checkOut: iso(4),
    guests: { adults: 2, children: 1, childAges: [9], infants: 0 },
    extras: [{ serviceId: "svc-dinner", quantity: 1 }],
    guest: { firstName: "Thomas", lastName: "Berg", email: "thomas@example.com", phone: "+49151111111" },
    status: "confirmed",
    totals: { nights: 3, roomSubtotal: 735, extrasSubtotal: 105, discountAmount: 0, taxAmount: 18, voucherApplied: 0, total: 858, lines: [], currency: "EUR" },
    createdAt: iso(-2),
    source: "booking.com",
  },
  {
    id: "seed-booking-3",
    code: "BD-DEMO03",
    roomId: "room-family-apartment",
    checkIn: iso(6),
    checkOut: iso(9),
    guests: { adults: 2, children: 2, childAges: [5, 8], infants: 0 },
    extras: [{ serviceId: "svc-kids-activities", quantity: 1 }],
    guest: { firstName: "Ioana", lastName: "Popescu", email: "ioana@example.com", phone: "+40722222222" },
    status: "pending",
    totals: { nights: 3, roomSubtotal: 585, extrasSubtotal: 60, discountAmount: 0, taxAmount: 18, voucherApplied: 0, total: 663, lines: [], currency: "EUR" },
    createdAt: iso(-1),
    source: "airbnb",
  },
];
