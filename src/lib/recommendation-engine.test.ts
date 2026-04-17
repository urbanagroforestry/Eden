import { describe, it, expect } from "vitest";
import { Layer } from "@prisma/client";
import { recommendPlants } from "@/lib/recommendation-engine";
import { getTemplate } from "@/lib/templates";

const mockPlant = (id: string, layer: Layer) => ({
  id,
  commonName: id,
  scientificName: id,
  layer,
  supportRole: null,
  edibleCategory: "fruit",
  edibleUse: "fresh",
  hardinessMin: 5,
  hardinessMax: 9,
  regionalTags: "temperate",
  sunNeeds: "full-sun",
  waterNeeds: "medium",
  soilTolerance: "loam",
  drainageTolerance: "well-drained",
  pHTolerance: "6-7",
  matureHeight: 1,
  matureWidth: 1,
  spreadHabit: "rounded",
  rootBehavior: "moderate",
  maintenanceLevel: "medium",
  rootRiskNearFoundation: 1,
  messyFruitRisk: 1,
  childFriendlyFlag: true,
  pollinatorValue: 3,
  biodiversityValue: 3,
  productionValue: 3,
  aestheticValue: 3,
  neighborhoodFriendliness: 3,
  notes: "",
  cautions: "",
  imagePath: null
});

describe("recommendation engine", () => {
  it("returns layered structure with alternatives and rationales", () => {
    const plants = [
      mockPlant("canopy-1", Layer.CANOPY),
      mockPlant("canopy-2", Layer.CANOPY),
      mockPlant("canopy-3", Layer.CANOPY),
      mockPlant("canopy-4", Layer.CANOPY),
      mockPlant("low-1", Layer.LOW_TREE),
      mockPlant("low-2", Layer.LOW_TREE),
      mockPlant("shrub-1", Layer.SHRUB),
      mockPlant("herb-1", Layer.HERBACEOUS),
      mockPlant("ground-1", Layer.GROUNDCOVER),
      mockPlant("root-1", Layer.RHIZOSPHERE),
      mockPlant("vine-1", Layer.VERTICAL),
      { ...mockPlant("support-1", Layer.SUPPORT), supportRole: "pollinator" }
    ];

    const out = recommendPlants({
      plants: plants as any,
      template: getTemplate("balanced-suburban"),
      prefs: {
        goals: ["foodProduction"],
        maintenanceTolerance: "medium",
        irrigationTolerance: "medium",
        stylePreference: "balanced",
        householdPriorities: ["fruit"],
        constraints: []
      },
      site: {
        lotAreaSqm: 900,
        hardinessZone: "8a",
        hardinessConfidence: "MEDIUM" as any,
        precipitationBand: "medium",
        precipitationConf: "MEDIUM" as any,
        sunExposure: { "full-sun": 0.5, "part-shade": 0.3, shade: 0.2 },
        slopeAspect: "gentle",
        slopeConfidence: "VERIFY" as any,
        zoneAreas: { foundation: 100, edge: 200, open: 400, access: 200 }
      }
    });

    expect(out.byLayer).toHaveLength(7);
    expect(out.byLayer.every((layer) => Array.isArray(layer.recommended) && Array.isArray(layer.alternatives))).toBe(true);
    expect(out.byLayer.every((layer) => Array.isArray(layer.recommendedRationales))).toBe(true);
    expect(out.byLayer.find((l) => l.layer === Layer.CANOPY)?.alternatives.length).toBeGreaterThan(0);
    expect(Array.isArray(out.supportSpecies)).toBe(true);
  });
});
