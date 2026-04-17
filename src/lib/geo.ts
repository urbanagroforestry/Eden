import * as turf from "@turf/turf";

export function areaFromBoundary(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const poly = turf.polygon([[...points, points[0]]]);
  return turf.area(poly);
}

export function isValidBoundary(points: [number, number][]): { valid: boolean; reason?: string } {
  if (points.length < 3) return { valid: false, reason: "Polygon needs at least 3 points" };
  try {
    const poly = turf.polygon([[...points, points[0]]]);
    const kinks = turf.kinks(poly);
    if (kinks.features.length > 0) return { valid: false, reason: "Boundary self-intersects" };
    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid polygon geometry" };
  }
}
