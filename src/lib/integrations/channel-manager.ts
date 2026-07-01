/**
 * Forward-looking adapters for section 12 ("Integrări viitoare"): Booking.com,
 * Airbnb, Expedia, a generic Channel Manager / PMS, smart locks, restaurant
 * POS, accounting, e-Factura, CRM and ComunaTa / Baeco Digital Score.
 *
 * None of these have a stable public API to integrate against yet in this
 * project, so they're modeled as a single typed interface every future
 * provider adapter should implement — plug a real client in behind
 * `ChannelManagerAdapter` and register it in `getChannelManagerAdapter()`.
 */

import type { Booking } from "@/lib/types";

export interface ChannelManagerAdapter {
  provider: "booking.com" | "airbnb" | "expedia" | "pms" | "channex" | "smart-lock" | "pos" | "accounting" | "e-factura" | "crm";
  pushAvailability(roomId: string, dates: { date: string; available: boolean }[]): Promise<void>;
  pullBookings(): Promise<Booking[]>;
}

const registry = new Map<string, ChannelManagerAdapter>();

export function registerChannelManagerAdapter(adapter: ChannelManagerAdapter) {
  registry.set(adapter.provider, adapter);
}

export function getChannelManagerAdapter(provider: ChannelManagerAdapter["provider"]) {
  return registry.get(provider) ?? null;
}
