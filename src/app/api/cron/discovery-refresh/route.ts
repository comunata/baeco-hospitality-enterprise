import { NextRequest, NextResponse } from "next/server";
import { runDiscoveryScan } from "@/lib/discovery/engine";
import { getPropertyProfile, ingestCandidates, recordScan, markDiscoveryRun } from "@/lib/data/discovery";
import { BD_CATEGORIES } from "@/lib/discovery/types";

/**
 * Scheduled discovery refresh — the "AI Discovery Scheduler".
 *
 * Call weekly from any scheduler (Netlify Scheduled Functions, Supabase cron,
 * GitHub Actions, uptime pinger) with the shared secret:
 *
 *   POST /api/cron/discovery-refresh
 *   Header: x-cron-secret: $CRON_SECRET
 *
 * New places land as `pending` in the admin review queue; places already
 * rejected stay rejected, so re-scans never re-surface refused entries.
 * The scan log gives the admin the "3 restaurante noi" diff on next login.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getPropertyProfile();
  if (!profile.lat || !profile.lng) {
    return NextResponse.json({ error: "property_not_configured" }, { status: 409 });
  }

  try {
    const { candidates, source } = await runDiscoveryScan({
      lat: profile.lat,
      lng: profile.lng,
      radiusKm: profile.discoveryRadiusKm,
    });
    const newCount = await ingestCandidates(candidates);
    await recordScan({
      trigger: "scheduled",
      radiusKm: profile.discoveryRadiusKm,
      categories: [...BD_CATEGORIES],
      status: "completed",
      foundCount: candidates.length,
      newCount,
      message: source === "sample" ? "Sursă: set demo (API OSM indisponibil)" : "Sursă: OpenStreetMap",
    });
    await markDiscoveryRun();
    return NextResponse.json({ ok: true, found: candidates.length, new: newCount, source });
  } catch (err) {
    await recordScan({
      trigger: "scheduled",
      radiusKm: profile.discoveryRadiusKm,
      categories: [],
      status: "failed",
      foundCount: 0,
      newCount: 0,
      message: err instanceof Error ? err.message : "error",
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
