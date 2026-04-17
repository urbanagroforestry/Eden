import { Layer } from "@prisma/client";

export function generateLayout(boundary: [number, number][], layers: { layer: Layer; names: string[] }[]) {
  if (boundary.length < 3) return [];
  const [minLon, maxLon] = [Math.min(...boundary.map((p) => p[0])), Math.max(...boundary.map((p) => p[0]))];
  const [minLat, maxLat] = [Math.min(...boundary.map((p) => p[1])), Math.max(...boundary.map((p) => p[1]))];

  const zoneTypeByLayer: Record<string, string> = {
    CANOPY: "canopy-zone",
    LOW_TREE: "edge-zone",
    SHRUB: "edge-zone",
    HERBACEOUS: "open-sun-zone",
    GROUNDCOVER: "foundation-zone",
    RHIZOSPHERE: "open-sun-zone",
    VERTICAL: "access-zone"
  };

  return layers.flatMap((l, idx) =>
    l.names.slice(0, 2).map((label, i) => ({
      label,
      layer: l.layer,
      lat: minLat + ((idx + 1) / (layers.length + 1)) * (maxLat - minLat) + i * 0.00003,
      lon: minLon + ((i + 1) / 3) * (maxLon - minLon),
      radiusMeters: [6, 4, 2, 1.2, 1, 1, 1.5][idx] ?? 2,
      zoneType: zoneTypeByLayer[l.layer],
      rationale: `Placed in ${zoneTypeByLayer[l.layer]} based on layer habit and access heuristics.`,
      confidence: "MEDIUM" as const
    }))
  );
}
