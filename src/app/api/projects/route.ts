import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { areaFromBoundary, isValidBoundary } from "@/lib/geo";
import { HeuristicEnvironmentalAdapter } from "@/lib/adapters";

const projectSchema = z.object({
  name: z.string().min(3),
  address: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  boundary: z.array(z.tuple([z.number(), z.number()])).optional(),
  shadeZones: z.array(z.object({ id: z.string(), level: z.enum(["full-sun", "part-shade", "shade"]), points: z.array(z.tuple([z.number(), z.number()])) })).optional(),
  preferences: z.object({
    goals: z.array(z.string()),
    maintenanceTolerance: z.string(),
    irrigationTolerance: z.string(),
    stylePreference: z.string(),
    householdPriorities: z.array(z.string()),
    constraints: z.array(z.string()),
    templateKey: z.string()
  })
});

export async function GET() {
  const projects = await prisma.project.findMany({ include: { siteProfile: true, preferences: true, layoutItems: true }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const parsed = projectSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const input = parsed.data;
  if (input.boundary) {
    const validity = isValidBoundary(input.boundary);
    if (!validity.valid) return NextResponse.json({ error: validity.reason }, { status: 400 });
  }

  const area = input.boundary ? areaFromBoundary(input.boundary) : 800;
  const adapter = new HeuristicEnvironmentalAdapter();
  const profile = await adapter.getSiteProfile({
    latitude: input.latitude,
    longitude: input.longitude,
    lotAreaSqm: area,
    boundary: input.boundary,
    shadeZones: input.shadeZones
  });

  const project = await prisma.project.create({
    data: {
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      boundaryGeoJson: input.boundary ? JSON.stringify(input.boundary) : null,
      shadeGeoJson: input.shadeZones ? JSON.stringify(input.shadeZones) : null,
      siteProfile: {
        create: {
          lotAreaSqm: profile.lotAreaSqm,
          hardinessZone: profile.hardinessZone,
          hardinessConfidence: profile.hardinessConfidence,
          precipitationBand: profile.precipitationBand,
          precipitationConf: profile.precipitationConf,
          sunExposureJson: JSON.stringify(profile.sunExposure),
          slopeAspect: profile.slopeAspect,
          slopeConfidence: profile.slopeConfidence,
          zoneAreasJson: JSON.stringify(profile.zoneAreas)
        }
      },
      preferences: {
        create: {
          goals: JSON.stringify(input.preferences.goals),
          maintenanceTolerance: input.preferences.maintenanceTolerance,
          irrigationTolerance: input.preferences.irrigationTolerance,
          stylePreference: input.preferences.stylePreference,
          householdPriorities: JSON.stringify(input.preferences.householdPriorities),
          constraints: JSON.stringify(input.preferences.constraints),
          templateKey: input.preferences.templateKey
        }
      }
    },
    include: { siteProfile: true, preferences: true }
  });

  return NextResponse.json(project, { status: 201 });
}
