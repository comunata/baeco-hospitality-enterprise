import type { Booking } from "@/lib/types";
import { siteConfig } from "@/config/site";

function toIcsDate(date: string) {
  return date.replace(/-/g, "");
}

/** Generates a downloadable .ics file for a booking (works today, no API keys needed). */
export function generateBookingIcs(booking: Booking, roomName: string): string {
  const uid = `${booking.code}@baeco-hospitality`;
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Baeco Hospitality//Booking Engine//RO",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${toIcsDate(booking.checkIn)}`,
    `DTEND;VALUE=DATE:${toIcsDate(booking.checkOut)}`,
    `SUMMARY:${siteConfig.name} — ${roomName}`,
    `DESCRIPTION:Rezervare ${booking.code} pentru ${booking.guest.firstName} ${booking.guest.lastName}`,
    `LOCATION:${siteConfig.contact.address}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

const googleClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;

/** OAuth-based two-way sync (blocks room availability in Admin when an
 * external calendar event overlaps). Requires the property owner to connect
 * their account from Admin > Integrations once client IDs are configured. */
export function isGoogleCalendarConfigured() {
  return Boolean(googleClientId);
}
export function isOutlookCalendarConfigured() {
  return Boolean(microsoftClientId);
}
