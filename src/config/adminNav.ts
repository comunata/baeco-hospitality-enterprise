export interface AdminNavItem {
  href: string;
  /** Hidden from the sidebar for anyone but SUPER_ADMIN — still enforced
   * server-side regardless (see requireAdminRole in the page itself), this
   * just avoids a confusing dead-end link for roles that can't open it. */
  superAdminOnly?: boolean;
  labelKey:
    | "dashboard"
    | "calendar"
    | "bookings"
    | "customers"
    | "rooms"
    | "rates"
    | "seasons"
    | "services"
    | "gallery"
    | "offers"
    | "promotions"
    | "vouchers"
    | "reviews"
    | "explore"
    | "discovery"
    | "restaurants"
    | "attractions"
    | "events"
    | "knowledgeBase"
    | "translations"
    | "seo"
    | "pages"
    | "settings"
    | "users"
    | "roles"
    | "integrations"
    | "aiManager";
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  { title: "Overview", items: [{ href: "/admin", labelKey: "dashboard" }, { href: "/admin/calendar", labelKey: "calendar" }] },
  {
    title: "Rezervări",
    items: [
      { href: "/admin/bookings", labelKey: "bookings" },
      { href: "/admin/customers", labelKey: "customers" },
    ],
  },
  {
    title: "Inventar",
    items: [
      { href: "/admin/rooms", labelKey: "rooms" },
      { href: "/admin/rates", labelKey: "rates" },
      { href: "/admin/seasons", labelKey: "seasons" },
      { href: "/admin/services", labelKey: "services" },
      { href: "/admin/gallery", labelKey: "gallery" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/offers", labelKey: "offers" },
      { href: "/admin/promotions", labelKey: "promotions" },
      { href: "/admin/vouchers", labelKey: "vouchers" },
      { href: "/admin/reviews", labelKey: "reviews" },
    ],
  },
  {
    title: "Explore Area",
    items: [
      { href: "/admin/discovery", labelKey: "discovery" },
      { href: "/admin/explore", labelKey: "explore" },
      { href: "/admin/restaurants", labelKey: "restaurants" },
      { href: "/admin/attractions", labelKey: "attractions" },
      { href: "/admin/events", labelKey: "events" },
    ],
  },
  {
    title: "AI & Content",
    items: [
      { href: "/admin/pages", labelKey: "pages" },
      { href: "/admin/knowledge-base", labelKey: "knowledgeBase" },
      { href: "/admin/translations", labelKey: "translations" },
      { href: "/admin/seo", labelKey: "seo" },
      { href: "/admin/ai-manager", labelKey: "aiManager" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/settings", labelKey: "settings" },
      { href: "/admin/users", labelKey: "users", superAdminOnly: true },
      { href: "/admin/roles", labelKey: "roles", superAdminOnly: true },
      { href: "/admin/integrations", labelKey: "integrations", superAdminOnly: true },
    ],
  },
];
