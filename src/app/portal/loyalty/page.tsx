import { getServerDictionary } from "@/lib/i18n/server";
import { getPortalSession } from "@/lib/portal/session";
import { getBookingsForGuestEmail } from "@/lib/data/bookings";
import { renderTemplate } from "@/lib/i18n/template";

const POINTS_PER_EUR = 1;
const TIERS = [
  { name: "Silver", min: 0 },
  { name: "Gold", min: 500 },
  { name: "Platinum", min: 1500 },
];

export default async function PortalLoyaltyPage() {
  const { dict } = await getServerDictionary();
  const session = await getPortalSession();
  const bookings = await getBookingsForGuestEmail(session.email);

  const points = Math.round(
    bookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.totals.total, 0) * POINTS_PER_EUR
  );
  const tier = [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
  const nextTier = TIERS.find((t) => t.min > points);

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-ivory">{dict.portal.loyaltyPoints}</h1>
      <div className="rounded-sm border border-champagne/30 bg-graphite p-8">
        <p className="text-xs uppercase tracking-widest text-stone">{dict.portal.loyaltyCurrentTier}</p>
        <p className="mt-1 font-display text-3xl text-champagne">{tier.name}</p>
        <p className="mt-4 text-sm text-stone">{points} {dict.portal.loyaltyPointsEarned}</p>
        {nextTier && (
          <p className="mt-1 text-sm text-stone">
            {renderTemplate(dict.portal.loyaltyPointsToNextTier, { points: nextTier.min - points, tier: nextTier.name })}
          </p>
        )}
      </div>
    </div>
  );
}
