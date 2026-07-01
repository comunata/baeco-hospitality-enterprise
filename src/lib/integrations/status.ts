import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface IntegrationStatus {
  key: string;
  label: string;
  configured: boolean;
  envVars: string[];
}

export function getIntegrationStatuses(): IntegrationStatus[] {
  return [
    { key: "supabase", label: "Supabase (auth, database, storage)", configured: isSupabaseConfigured(), envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] },
    { key: "openai", label: "OpenAI (AI Concierge, AI Local Guide, AI Manager, AI Content Studio)", configured: Boolean(process.env.OPENAI_API_KEY), envVars: ["OPENAI_API_KEY"] },
    { key: "email", label: "Email (Resend / SendGrid)", configured: Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY), envVars: ["RESEND_API_KEY", "SENDGRID_API_KEY", "EMAIL_FROM"] },
    { key: "whatsapp", label: "WhatsApp Business Cloud API", configured: Boolean(process.env.WHATSAPP_BUSINESS_TOKEN && process.env.WHATSAPP_PHONE_ID), envVars: ["WHATSAPP_BUSINESS_TOKEN", "WHATSAPP_PHONE_ID"] },
    { key: "maps", label: "Google Maps", configured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), envVars: ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"] },
    { key: "weather", label: "Weather API (OpenWeather)", configured: Boolean(process.env.OPENWEATHER_API_KEY), envVars: ["OPENWEATHER_API_KEY"] },
    { key: "stripe", label: "Stripe", configured: Boolean(process.env.STRIPE_SECRET_KEY), envVars: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] },
    { key: "revolut", label: "Revolut Business", configured: Boolean(process.env.REVOLUT_API_KEY), envVars: ["REVOLUT_API_KEY"] },
    { key: "paypal", label: "PayPal", configured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET), envVars: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"] },
    { key: "google-calendar", label: "Google Calendar sync", configured: Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID), envVars: ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET"] },
    { key: "outlook-calendar", label: "Outlook Calendar sync", configured: Boolean(process.env.MICROSOFT_CLIENT_ID), envVars: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"] },
    { key: "analytics", label: "Google Analytics / Meta Pixel", configured: Boolean(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID), envVars: ["NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_META_PIXEL_ID"] },
    { key: "booking-com", label: "Booking.com (Channel Manager)", configured: Boolean(process.env.BOOKING_COM_API_KEY), envVars: ["BOOKING_COM_API_KEY"] },
    { key: "airbnb", label: "Airbnb", configured: Boolean(process.env.AIRBNB_API_KEY), envVars: ["AIRBNB_API_KEY"] },
    { key: "expedia", label: "Expedia", configured: Boolean(process.env.EXPEDIA_API_KEY), envVars: ["EXPEDIA_API_KEY"] },
  ];
}
