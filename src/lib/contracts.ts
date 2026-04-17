import { Confidence, Layer } from "@prisma/client";

export type ProjectRecord = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  boundaryGeoJson: string | null;
  shadeGeoJson: string | null;
  structuresJson: string | null;
  siteProfile?: {
    lotAreaSqm: number;
    hardinessZone: string;
    hardinessConfidence: Confidence;
    precipitationBand: string;
    precipitationConf: Confidence;
    sunExposureJson: string;
    slopeAspect: string;
    slopeConfidence: Confidence;
    zoneAreasJson: string;
  } | null;
  preferences?: {
    goals: string;
    maintenanceTolerance: string;
    irrigationTolerance: string;
    stylePreference: string;
    householdPriorities: string;
    constraints: string;
    templateKey: string;
  } | null;
  layoutItems?: LayoutItemRecord[];
};

export type LayoutItemRecord = {
  id: string;
  label: string;
  layer: Layer;
  lat: number;
  lon: number;
  radiusMeters: number;
  zoneType: string;
  rationale: string;
  confidence: Confidence;
};

export type RecommendationResponse = {
  byLayer: {
    layer: Layer;
    recommended: { id: string; commonName: string; supportRole: string | null }[];
    alternatives: { id: string; commonName: string; supportRole: string | null }[];
    recommendedRationales: string[];
    warning?: string;
  }[];
  supportSpecies: { id: string; commonName: string; supportRole: string | null }[];
  rationale: string[];
  confidence: "high" | "medium" | "verify";
  maintenanceEstimate: string;
  phasedPlan: string[];
};
