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
