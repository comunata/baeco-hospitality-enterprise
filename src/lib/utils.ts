import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = "RON", locale = "ro-RO") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(date: string | Date, locale = "ro-RO") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when `value` looks like a real Postgres uuid. Several `lib/data/*`
 * modules serve seed/demo data with fixed slug-shaped ids (e.g.
 * "svc-dinner", "season-low") when the matching DB table is empty; those
 * ids must never be sent into a `.eq("id", …)`/upsert against a uuid
 * column, or Postgres rejects the query with "invalid input syntax for
 * type uuid" before it can even report "not found".
 */
export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
