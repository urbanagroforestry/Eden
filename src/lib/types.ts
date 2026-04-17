import { Layer, Confidence } from "@prisma/client";

export const FOOD_FOREST_LAYERS: Layer[] = [
  Layer.CANOPY,
  Layer.LOW_TREE,
  Layer.SHRUB,
  Layer.HERBACEOUS,
  Layer.GROUNDCOVER,
  Layer.RHIZOSPHERE,
  Layer.VERTICAL
];

export type ShadeLevel = "full-sun" | "part-shade" | "shade";

export type ShadeZone = {
  id: string;
  level: ShadeLevel;
  points: [number, number][];
};

export type SiteProfileInput = {
  latitude: number;
  longitude: number;
  lotAreaSqm: number;
  boundary?: [number, number][];
  shadeZones?: ShadeZone[];
};

export type SiteProfileResult = {
  lotAreaSqm: number;
  hardinessZone: string;
  hardinessConfidence: Confidence;
  precipitationBand: string;
  precipitationConf: Confidence;
  sunExposure: Record<ShadeLevel, number>;
  slopeAspect: string;
  slopeConfidence: Confidence;
  zoneAreas: { foundation: number; edge: number; open: number; access: number };
};

export type Template = {
  key: string;
  name: string;
  description: string;
  weights: {
    production: number;
    biodiversity: number;
    aesthetics: number;
    maintenanceFit: number;
    waterFit: number;
    neighborhoodFriendliness: number;
  };
  layerCoverageBias: number;
  supportBoost: number;
};
