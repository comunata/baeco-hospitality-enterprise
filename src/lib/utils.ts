import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = "EUR", locale = "ro-RO") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(date: string | Date, locale = "ro-RO") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
