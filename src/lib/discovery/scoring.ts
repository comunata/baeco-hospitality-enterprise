/**
 * Deterministic quality score (0–100) for a discovered place, based on data
 * completeness and prominence signals present in the source tags. Used to
 * rank the review queue (best candidates first) and to prioritize places in
 * generated itineraries — without any AI call.
 */
export function scoreOsmTags(tags: Record<string, string>): number {
  let score = 0;
  if (tags.name) score += 20;
  if (tags["name:en"]) score += 5;
  if (tags.website || tags["contact:website"]) score += 15;
  if (tags.phone || tags["contact:phone"]) score += 10;
  if (tags.opening_hours) score += 10;
  if (tags.wikidata || tags.wikipedia) score += 20; // strong prominence signal
  if (tags.image || tags["image:0"]) score += 5;
  if (tags["addr:street"] || tags["addr:city"]) score += 10;
  if (tags.cuisine || tags.description) score += 5;
  return Math.min(100, score);
}

/** Straight-line distance in km (haversine). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Drive-time estimate from straight-line distance: road factor 1.3, average
 * 40 km/h (rural/mixed). Good enough for sorting and itinerary slotting;
 * exact routing is a paid-API concern deliberately kept out of the core.
 */
export function estimateDriveMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm * 1.3) / (40 / 60)));
}
