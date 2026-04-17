import { Template } from "@/lib/types";

export const DESIGN_TEMPLATES: Template[] = [
  { key: "balanced-suburban", name: "Balanced suburban food forest", description: "Blends edible yield, biodiversity, and neighborhood fit.", weights: { production: 1, biodiversity: 1, aesthetics: 1, maintenanceFit: 1, waterFit: 1, neighborhoodFriendliness: 1 }, layerCoverageBias: 1, supportBoost: 1 },
  { key: "tidy-front-yard", name: "Tidy front-yard edible landscape", description: "Cleaner forms, low-mess species, and high neighborhood friendliness.", weights: { production: 0.8, biodiversity: 0.8, aesthetics: 1.2, maintenanceFit: 1, waterFit: 1, neighborhoodFriendliness: 1.3 }, layerCoverageBias: 0.9, supportBoost: 0.8 },
  { key: "low-maintenance-pollinator", name: "Low-maintenance pollinator-food hybrid", description: "Prioritizes resilient species and support ecology.", weights: { production: 0.7, biodiversity: 1.2, aesthetics: 0.9, maintenanceFit: 1.3, waterFit: 1.2, neighborhoodFriendliness: 1 }, layerCoverageBias: 0.95, supportBoost: 1.4 },
  { key: "production-focused", name: "Production-focused backyard system", description: "Optimizes food output while retaining layered resilience.", weights: { production: 1.5, biodiversity: 0.8, aesthetics: 0.7, maintenanceFit: 0.8, waterFit: 0.8, neighborhoodFriendliness: 0.8 }, layerCoverageBias: 1.1, supportBoost: 1 }
];

export const getTemplate = (key?: string) => DESIGN_TEMPLATES.find((t) => t.key === key) ?? DESIGN_TEMPLATES[0];
