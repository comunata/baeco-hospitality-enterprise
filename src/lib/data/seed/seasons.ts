import type { Season } from "@/lib/types";

export const seedSeasons: Season[] = [
  { id: "season-low", name: { ro: "Sezon redus", en: "Low season" }, startDate: "2026-01-01", endDate: "2026-04-30", multiplier: 0.85, weekendMultiplier: 1.1, minNights: 1 },
  { id: "season-mid", name: { ro: "Sezon mediu", en: "Mid season" }, startDate: "2026-05-01", endDate: "2026-06-30", multiplier: 1, weekendMultiplier: 1.15, minNights: 1 },
  { id: "season-high", name: { ro: "Sezon de vârf", en: "High season" }, startDate: "2026-07-01", endDate: "2026-08-31", multiplier: 1.35, weekendMultiplier: 1.2, minNights: 1 },
  { id: "season-shoulder", name: { ro: "Sezon intermediar", en: "Shoulder season" }, startDate: "2026-09-01", endDate: "2026-10-31", multiplier: 1.05, weekendMultiplier: 1.15, minNights: 1 },
  { id: "season-winter", name: { ro: "Sărbători de iarnă", en: "Winter holidays" }, startDate: "2026-12-15", endDate: "2027-01-05", multiplier: 1.5, weekendMultiplier: 1.25, minNights: 3 },
];
