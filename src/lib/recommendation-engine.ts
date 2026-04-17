import { Layer, Plant } from "@prisma/client";
import { FOOD_FOREST_LAYERS, SiteProfileResult, Template } from "@/lib/types";

type Prefs = {
  goals: string[];
  maintenanceTolerance: string;
  irrigationTolerance: string;
  stylePreference: string;
  householdPriorities: string[];
  constraints: string[];
};

export type LayerRecommendation = {
  layer: Layer;
  recommended: Plant[];
  alternatives: Plant[];
  recommendedRationales: string[];
  warning?: string;
};

export type RecommendationOutput = {
  byLayer: LayerRecommendation[];
  supportSpecies: Plant[];
  rationale: string[];
  confidence: "high" | "medium" | "verify";
  maintenanceEstimate: string;
  phasedPlan: string[];
};



const regionFitScore = (regionalTags: string, precipitationBand: string): number => {
  const tags = regionalTags.toLowerCase();
  const isNorthTexas = precipitationBand.toLowerCase().includes("north-texas");

  if (!isNorthTexas) return tags.includes("nationwide") ? 0.8 : 0;

  if (tags.includes("north-texas") || tags.includes("texas") || tags.includes("south-central") || tags.includes("plains")) {
    return 3.2;
  }
  if (tags.includes("nationwide") || tags.includes("continental")) return 1.2;
  if (tags.includes("mediterranean") || tags.includes("coastal") || tags.includes("tropical") || tags.includes("pacific")) {
    return -2.4;
  }
  return -0.4;
};

const layerSunFit = (plantSun: string, fullSunShare: number) => {
  if (plantSun.includes("full-sun") && fullSunShare > 0.4) return 1;
  if (plantSun.includes("part-shade")) return 0.8;
  return 0.6;
};

export function recommendPlants(input: {
  plants: Plant[];
  site: SiteProfileResult;
  prefs: Prefs;
  template: Template;
}): RecommendationOutput {
  const zoneNum = Number(input.site.hardinessZone.slice(0, 1));
  const viable = input.plants.filter((p) => p.hardinessMin <= zoneNum && p.hardinessMax >= zoneNum);

  const scored = viable.map((p) => {
    const maintenanceFit = p.maintenanceLevel === input.prefs.maintenanceTolerance ? 5 : 3;
    const waterFit = p.waterNeeds === input.prefs.irrigationTolerance ? 5 : 3;
    const conflictPenalty = (
      (input.prefs.constraints.includes("avoidLargeRootsNearFoundation") ? p.rootRiskNearFoundation : 0) +
      (input.prefs.constraints.includes("avoidMessyFruitNearWalkway") ? p.messyFruitRisk : 0)
    ) * 0.6;

    const spreadPenalty = p.cautions.toLowerCase().includes("aggressive") ? 1.4 : 0;
    const regionalBoost = regionFitScore(p.regionalTags, input.site.precipitationBand);

    const score =
      p.productionValue * input.template.weights.production +
      p.biodiversityValue * input.template.weights.biodiversity +
      p.aestheticValue * input.template.weights.aesthetics +
      maintenanceFit * input.template.weights.maintenanceFit +
      waterFit * input.template.weights.waterFit +
      p.neighborhoodFriendliness * input.template.weights.neighborhoodFriendliness +
      layerSunFit(p.sunNeeds, input.site.sunExposure["full-sun"]) * 2 +
      regionalBoost -
      conflictPenalty -
      spreadPenalty;

    return { plant: p, score };
  });

  const byLayer: LayerRecommendation[] = FOOD_FOREST_LAYERS.map((layer) => {
    const layerPlants = scored
      .filter((s) => s.plant.layer === layer)
      .sort((a, b) => b.score - a.score);

    const recommended = layerPlants.slice(0, 3).map((x) => x.plant);
    const alternatives = layerPlants.slice(3, 7).map((x) => x.plant);

    return {
      layer,
      recommended,
      alternatives,
      recommendedRationales: recommended.map((p) => `${p.commonName} fits zone ${input.site.hardinessZone}, ${input.site.precipitationBand} moisture pattern, ${p.sunNeeds} light, and ${p.maintenanceLevel} maintenance expectations.`),
      warning: recommended.length === 0 ? "Low fit for this layer at current constraints. Verify on site." : undefined
    };
  });

  const supportSpecies = scored
    .filter((s) => s.plant.layer === Layer.SUPPORT)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.plant);

  const missingLayers = byLayer.filter((l) => l.recommended.length === 0).length;

  return {
    byLayer,
    supportSpecies,
    rationale: [
      "Selected species align with hardiness proxy, shade fit, and your selected objectives.",
      "User-corrected shade inputs override heuristic sun estimates where present.",
      "Constraints reduced high-mess and high-root-risk candidates near access and foundations."
    ],
    confidence: missingLayers > 2 ? "verify" : "medium",
    maintenanceEstimate: input.prefs.maintenanceTolerance === "low" ? "~2-4 hr/week seasonal" : "~4-7 hr/week seasonal",
    phasedPlan: [
      "Phase 1 (0-3 months): hardscape, access paths, and soil prep.",
      "Phase 2 (3-9 months): install canopy/understory frame and support guilds.",
      "Phase 3 (9-18 months): add shrubs, herbs, groundcovers, and vine training.",
      "Phase 4 (ongoing): tune irrigation, prune, and replace weak performers."
    ]
  };
}
