import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HeuristicEnvironmentalAdapter } from "@/lib/adapters";

const importSchema = z.object({
  name: z.string().min(3),
  address: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  boundaryGeoJson: z.string().optional().nullable(),
  shadeGeoJson: z.string().optional().nullable(),
  structuresJson: z.string().optional().nullable(),
  siteProfile: z
    .object({
      lotAreaSqm: z.number(),
      hardinessZone: z.string(),
      hardinessConfidence: z.enum(["HIGH", "MEDIUM", "VERIFY"]),
      precipitationBand: z.string(),
      precipitationConf: z.enum(["HIGH", "MEDIUM", "VERIFY"]),
      sunExposureJson: z.string(),
      slopeAspect: z.string(),
      slopeConfidence: z.enum(["HIGH", "MEDIUM", "VERIFY"]),
      zoneAreasJson: z.string()
    })
    .optional(),
  preferences: z
    .object({
      goals: z.string(),
      maintenanceTolerance: z.string(),
      irrigationTolerance: z.string(),
      stylePreference: z.string(),
      householdPriorities: z.string(),
      constraints: z.string(),
      templateKey: z.string()
    })
    .optional()
});

export async function POST(req: Request) {
  try {
    const payload = importSchema.parse(await req.json());
    const boundary = payload.boundaryGeoJson ? (JSON.parse(payload.boundaryGeoJson) as [number, number][]) : [];
    const shadeZones = payload.shadeGeoJson ? JSON.parse(payload.shadeGeoJson) : [];

    const adapter = new HeuristicEnvironmentalAdapter();
    const inferred = await adapter.getSiteProfile({
      latitude: payload.latitude,
      longitude: payload.longitude,
      lotAreaSqm: payload.siteProfile?.lotAreaSqm ?? 800,
      boundary,
      shadeZones
    });

    const created = await prisma.project.create({
      data: {
        name: `${payload.name} (imported)`,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        boundaryGeoJson: payload.boundaryGeoJson ?? null,
        shadeGeoJson: payload.shadeGeoJson ?? null,
        structuresJson: payload.structuresJson ?? null,
        siteProfile: {
          create: payload.siteProfile ?? {
            lotAreaSqm: inferred.lotAreaSqm,
            hardinessZone: inferred.hardinessZone,
            hardinessConfidence: inferred.hardinessConfidence,
            precipitationBand: inferred.precipitationBand,
            precipitationConf: inferred.precipitationConf,
            sunExposureJson: JSON.stringify(inferred.sunExposure),
            slopeAspect: inferred.slopeAspect,
            slopeConfidence: inferred.slopeConfidence,
            zoneAreasJson: JSON.stringify(inferred.zoneAreas)
          }
        },
        preferences: {
          create:
            payload.preferences ??
            {
              goals: JSON.stringify(["foodProduction", "biodiversity"]),
              maintenanceTolerance: "medium",
              irrigationTolerance: "medium",
              stylePreference: "balanced",
              householdPriorities: JSON.stringify(["fruit", "herbs"]),
              constraints: JSON.stringify([]),
              templateKey: "balanced-suburban"
            }
        }
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corrupted project state or invalid JSON." }, { status: 400 });
  }
}
