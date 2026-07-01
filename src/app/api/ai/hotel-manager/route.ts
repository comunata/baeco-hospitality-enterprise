import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/session";
import { getAllBookings } from "@/lib/data/bookings";
import { getRooms } from "@/lib/data/rooms";
import { getServices } from "@/lib/data/services";
import { completeChat, isAiConfigured } from "@/lib/integrations/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDictionary } from "@/lib/i18n";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { formatCurrency } from "@/lib/utils";

const requestSchema = z.object({
  question: z.string().min(1).max(1000),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "ai-hotel-manager", { maxRequests: 20, windowMs: 60_000 });
  if (limited) return limited;

  // Admin-only surface: reuses the same session gate as the rest of /admin.
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { question } = parsed.data;
  const locale = isLocale(parsed.data.locale ?? "") ? (parsed.data.locale as Locale) : defaultLocale;
  const dict = getDictionary(locale);

  const [bookings, rooms, services] = await Promise.all([getAllBookings(), getRooms(), getServices()]);

  // Real, grounded dashboard facts — the same figures shown on
  // /admin (occupancy, revenue, free rooms, popular services), computed
  // fresh here so the AI never has to invent numbers.
  const today = new Date().toISOString().slice(0, 10);
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");

  const todayBookings = activeBookings.filter((b) => b.checkIn <= today && b.checkOut > today);
  const occupiedRoomIds = new Set(todayBookings.map((b) => b.roomId));
  const occupancyRate = rooms.length ? Math.round((occupiedRoomIds.size / rooms.length) * 100) : 0;
  const freeRoomsToday = rooms.filter((r) => !occupiedRoomIds.has(r.id));

  const checkInsToday = activeBookings.filter((b) => b.checkIn === today);
  const checkOutsToday = activeBookings.filter((b) => b.checkOut === today);

  const currentMonth = today.slice(0, 7);
  const revenueToday = activeBookings
    .filter((b) => b.createdAt.slice(0, 10) === today)
    .reduce((sum, b) => sum + b.totals.total, 0);
  const revenueThisMonth = activeBookings
    .filter((b) => b.createdAt.slice(0, 7) === currentMonth)
    .reduce((sum, b) => sum + b.totals.total, 0);
  const upcomingRevenue = activeBookings.filter((b) => b.checkIn >= today).reduce((sum, b) => sum + b.totals.total, 0);

  const serviceUsage = new Map<string, number>();
  for (const booking of activeBookings) {
    for (const extra of booking.extras) {
      serviceUsage.set(extra.serviceId, (serviceUsage.get(extra.serviceId) ?? 0) + extra.quantity);
    }
  }
  const popularServices = [...serviceUsage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([serviceId, count]) => ({ service: services.find((s) => s.id === serviceId), count }))
    .filter((e): e is { service: NonNullable<typeof e.service>; count: number } => Boolean(e.service));

  const roomBookingCounts = new Map<string, number>();
  for (const booking of activeBookings) roomBookingCounts.set(booking.roomId, (roomBookingCounts.get(booking.roomId) ?? 0) + 1);

  const next7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const upcomingOccupancy = next7Days.map((date) => {
    const occupied = activeBookings.filter((b) => b.checkIn <= date && b.checkOut > date).length;
    return `${date}: ${rooms.length ? Math.round((occupied / rooms.length) * 100) : 0}% ocupare`;
  });

  const facts = [
    `Data curentă: ${today}.`,
    `Grad de ocupare azi: ${occupancyRate}% (${occupiedRoomIds.size}/${rooms.length} camere ocupate).`,
    `Camere libere azi: ${freeRoomsToday.map((r) => r.name[locale] ?? r.name.en).join(", ") || "niciuna"}.`,
    `Check-in azi: ${checkInsToday.length}. Check-out azi: ${checkOutsToday.length}.`,
    `Venit azi (rezervări create azi): ${formatCurrency(revenueToday)}.`,
    `Venit luna curentă: ${formatCurrency(revenueThisMonth)}.`,
    `Venit viitor (rezervări active cu check-in >= azi): ${formatCurrency(upcomingRevenue)}.`,
    `Total rezervări active: ${activeBookings.length}. Total camere: ${rooms.length}.`,
    `Ocupare estimată următoarele 7 zile:\n${upcomingOccupancy.join("\n")}`,
    `Servicii extra cele mai populare: ${popularServices.map((p) => `${p.service.name[locale] ?? p.service.name.en} (${p.count}x)`).join(", ") || "—"}.`,
    `Camere după numărul de rezervări: ${[...roomBookingCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([roomId, count]) => `${rooms.find((r) => r.id === roomId)?.name[locale] ?? roomId}: ${count}`)
      .join(", ") || "—"}.`,
  ].join("\n");

  if (await isAiConfigured()) {
    const answer = await completeChat([
      {
        role: "system",
        content:
          `You are the AI Hotel Manager assistant for ${dict.common.brand}, used internally by hotel staff/admins. ` +
          `Answer ONLY using the real dashboard data below — never invent occupancy, revenue, or booking figures. ` +
          `Be concise and actionable (e.g. suggest a promotion if occupancy is low, flag upcoming check-ins). ` +
          `Reply in ${locale === "ro" ? "Romanian" : "English"}.\n\nReal hotel data:\n${facts}`,
      },
      { role: "user", content: question },
    ]);
    if (answer) return NextResponse.json({ answer });
  }

  // Deterministic fallback (no AI key configured): return the raw grounded
  // facts so the dashboard still answers useful questions without an LLM.
  return NextResponse.json({ answer: facts });
}
