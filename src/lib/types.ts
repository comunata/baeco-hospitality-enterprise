export interface LocalizedText {
  ro: string;
  en: string;
  [locale: string]: string | undefined;
}

export interface Room {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  gallery: string[];
  coverImage: string;
  maxAdults: number;
  maxChildren: number;
  sizeSqm: number;
  beds: string[];
  amenities: string[];
  basePrice: number;
  rules: LocalizedText;
  includedServiceIds: string[];
  extraServiceIds: string[];
  virtualTourUrl?: string;
  active: boolean;
}

export type ExtraServiceChargeType = "per_person" | "per_room" | "per_booking" | "per_night";

export interface ExtraService {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  chargeType: ExtraServiceChargeType;
  active: boolean;
  availableFrom?: string;
  availableTo?: string;
}

export interface Season {
  id: string;
  name: LocalizedText;
  startDate: string;
  endDate: string;
  multiplier: number;
  weekendMultiplier: number;
  minNights?: number;
}

export interface Promotion {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  validFrom: string;
  validTo: string;
  maxRedemptions?: number;
  redemptions: number;
  active: boolean;
  /** Minimum number of nights the stay must cover for the code to apply. */
  minNights?: number;
  /** Minimum pre-discount subtotal (room + extras) required for the code to apply. */
  minSubtotal?: number;
}

export interface GiftVoucher {
  id: string;
  code: string;
  balance: number;
  initialValue: number;
  expiresAt: string;
  active: boolean;
}

export interface BookingGuestCounts {
  adults: number;
  children: number;
  childAges: number[];
  infants: number;
}

export interface BookingExtra {
  serviceId: string;
  quantity: number;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  code: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: BookingGuestCounts;
  extras: BookingExtra[];
  promoCode?: string;
  voucherCode?: string;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  status: BookingStatus;
  totals: PriceBreakdown;
  createdAt: string;
  source: "website" | "booking.com" | "airbnb" | "expedia" | "phone" | "admin";
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  nights: number;
  roomSubtotal: number;
  extrasSubtotal: number;
  discountAmount: number;
  taxAmount: number;
  voucherApplied: number;
  total: number;
  lines: PriceLine[];
  currency: string;
}

export interface Attraction {
  id: string;
  name: LocalizedText;
  category: "attraction" | "restaurant" | "cafe" | "market" | "shop" | "producer";
  description: LocalizedText;
  image?: string;
  distanceKm: number;
  driveMinutes: number;
  tags: string[];
  goodFor: ("family" | "romantic" | "rainy-day" | "kids")[];
  lat: number;
  lng: number;
}

export interface LocalEvent {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  date: string;
  location: string;
}

export interface Review {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  roomName?: string;
  createdAt: string;
  source: "website" | "google" | "booking.com" | "airbnb";
}

export interface KnowledgeItem {
  id: string;
  category: string;
  question: LocalizedText;
  answer: LocalizedText;
  keywords: string[];
}

export interface Offer {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  image?: string;
  discountPercent?: number;
  validFrom: string;
  validTo: string;
  active: boolean;
}
