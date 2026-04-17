import { Confidence } from "@prisma/client";
import SunCalc from "suncalc";
import { SiteProfileInput, SiteProfileResult } from "@/lib/types";

export interface EnvironmentalAdapter {
  getSiteProfile(input: SiteProfileInput): Promise<SiteProfileResult>;
}

export interface FutureDataAdapter {
  source: "USDA" | "NOAA" | "EPA" | "USGS" | "MOBILE_SCAN" | "NURSERY";
  description: string;
  status: "mock" | "planned";
  fetch: (lat: number, lon: number) => Promise<unknown>;
}

const estimateHardiness = (lat: number): string => {
  const abs = Math.abs(lat);
  if (abs > 47) return "5b";
  if (abs > 43) return "6b";
  if (abs > 39) return "7a";
  if (abs > 34) return "8a";
  if (abs > 30) return "9a";
  return "10a";
};

const estimatePrecip = (lon: number): string => {
  if (lon < -120) return "medium-high";
  if (lon < -105) return "low";
  if (lon < -90) return "medium";
  return "medium-high";
};

export class HeuristicEnvironmentalAdapter implements EnvironmentalAdapter {
  async getSiteProfile(input: SiteProfileInput): Promise<SiteProfileResult> {
    const date = new Date("2026-06-21T12:00:00Z");
    const sun = SunCalc.getTimes(date, input.latitude, input.longitude);
    const daylight = (sun.sunset.getTime() - sun.sunrise.getTime()) / 3600000;
    const openSun = Math.min(0.75, Math.max(0.35, daylight / 18));
    const manual = input.shadeZones?.length
      ? input.shadeZones.reduce(
          (acc, z) => {
            acc[z.level] += 1;
            return acc;
          },
          { "full-sun": 0, "part-shade": 0, shade: 0 }
        )
      : null;

    const totalManual = manual ? manual["full-sun"] + manual["part-shade"] + manual.shade : 0;
    const sunExposure = totalManual
      ? {
          "full-sun": manual!["full-sun"] / totalManual,
          "part-shade": manual!["part-shade"] / totalManual,
          shade: manual!.shade / totalManual
        }
      : { "full-sun": openSun, "part-shade": 0.3, shade: 1 - openSun - 0.3 };

    return {
      lotAreaSqm: input.lotAreaSqm,
      hardinessZone: estimateHardiness(input.latitude),
      hardinessConfidence: Confidence.MEDIUM,
      precipitationBand: estimatePrecip(input.longitude),
      precipitationConf: Confidence.MEDIUM,
      sunExposure,
      slopeAspect: input.latitude > 38 ? "gentle south" : "gentle east",
      slopeConfidence: Confidence.VERIFY,
      zoneAreas: {
        foundation: input.lotAreaSqm * 0.15,
        edge: input.lotAreaSqm * 0.25,
        open: input.lotAreaSqm * 0.45,
        access: input.lotAreaSqm * 0.15
      }
    };
  }
}

export const FUTURE_ADAPTERS: FutureDataAdapter[] = [
  { source: "USDA", description: "USDA soils integration adapter", status: "planned", fetch: async () => ({ note: "Use gSSURGO" }) },
  { source: "NOAA", description: "NOAA climate normals adapter", status: "planned", fetch: async () => ({ note: "Use climate normals API" }) },
  { source: "EPA", description: "EPA ecoregion adapter", status: "planned", fetch: async () => ({ note: "Use level III ecoregions" }) },
  { source: "USGS", description: "USGS terrain/LiDAR adapter", status: "planned", fetch: async () => ({ note: "Use 3DEP derivatives" }) },
  { source: "MOBILE_SCAN", description: "Photo/LiDAR scan refinement adapter", status: "mock", fetch: async () => ({ note: "Await mobile capture" }) },
  { source: "NURSERY", description: "Nursery inventory adapter", status: "planned", fetch: async () => ({ note: "Availability and lead time" }) }
];
