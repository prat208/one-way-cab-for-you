/**
 * Minimum billable distance slabs.
 * - Any trip under 200 km is billed at 200 km.
 * - Any trip between 200 km and 300 km is billed at 300 km.
 * - Above 300 km, actual distance is billed.
 */
export function billableDistanceKm(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 200;
  if (distanceKm <= 200) return 200;
  if (distanceKm <= 300) return 300;
  return Math.round(distanceKm);
}

/** Official rate card (per km, all inclusive). Keyed by vehicle category. */
export const RATE_CARD_PER_KM: Record<string, number> = {
  sedan: 13,
  suv: 16,
  premium: 18,
  tempo: 26,
};

/** Fixed one-way route prices from the rate card. */
export const FIXED_ROUTE_FARES: Array<{
  from: string;
  to: string;
  sedan: number;
  suv: number;
  premium: number;
}> = [
  { from: "Kolhapur", to: "Pune", sedan: 3500, suv: 4500, premium: 6500 },
  { from: "Kolhapur", to: "Mumbai", sedan: 6000, suv: 7000, premium: 11000 },
  { from: "Kolhapur", to: "Goa", sedan: 3500, suv: 4500, premium: 6500 },
  { from: "Mumbai", to: "Goa", sedan: 9500, suv: 11500, premium: 16500 },
  { from: "Pune", to: "Goa", sedan: 7000, suv: 9000, premium: 13500 },
  { from: "Kolhapur", to: "Solapur", sedan: 3500, suv: 4500, premium: 7000 },
  { from: "Sangli", to: "Mumbai", sedan: 6000, suv: 7000, premium: 11000 },
  { from: "Sangli", to: "Pune", sedan: 3500, suv: 4500, premium: 6500 },
  { from: "Pune", to: "Mumbai", sedan: 2500, suv: 3000, premium: 4500 },
];

function cityKey(s: string) {
  // "Pune, Maharashtra" -> "pune"
  return s.split(",")[0].trim().toLowerCase().replace(/\s+/g, " ");
}

export function fixedRouteFare(from: string, to: string, category: string): number | null {
  const a = cityKey(from);
  const b = cityKey(to);
  const r = FIXED_ROUTE_FARES.find(
    (x) =>
      (x.from.toLowerCase() === a && x.to.toLowerCase() === b) ||
      (x.from.toLowerCase() === b && x.to.toLowerCase() === a),
  );
  if (!r) return null;
  const v = (r as Record<string, unknown>)[category];
  return typeof v === "number" ? v : null;
}

export function perKmRate(category: string, fallback: number): number {
  return RATE_CARD_PER_KM[category] ?? fallback;
}
