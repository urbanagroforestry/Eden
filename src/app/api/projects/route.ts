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
  shadeZones: z
    .array(
      z.object({
        id: z.string(),
        level: z.enum(["full-sun", "part-shade", "shade"]),
        points: z.array(z.tuple([z.number(), z.number()]))
      })
    )
    .optional(),
  structures: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["structure", "existing-tree"]),
        point: z.tuple([z.number(), z.number()])
      })
    )
    .optional(),
  circles: z
    .array(
      z.object({
        id: z.string(),
        center: z.tuple([z.number(), z.number()]),
        radiusMeters: z.number().positive()
      })
    )
    .optional(),
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

const jsonError = (message: string, status = 500) => NextResponse.json({ error: message }, { status });

export async function GET() {
  try {
    const projects = await prisma.project.findMany({ include: { siteProfile: true, preferences: true, layoutItems: true }, orderBy: { updatedAt: "desc" } });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("[api/projects][GET] unexpected error", error);
    return jsonError("Unable to list projects.");
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = projectSchema.safeParse(payload);
    if (!parsed.success) return jsonError("Invalid project payload.", 400);

    const input = parsed.data;
    console.info("[api/projects][POST] payload parsed", {
      name: input.name,
      hasBoundary: Boolean(input.boundary?.length),
      shadeZones: input.shadeZones?.length ?? 0,
      structures: input.structures?.length ?? 0,
      circles: input.circles?.length ?? 0
    });

    if (input.boundary) {
      const validity = isValidBoundary(input.boundary);
      if (!validity.valid) return jsonError(validity.reason || "Boundary is invalid.", 400);
      console.info("[api/projects][POST] boundary validated", { points: input.boundary.length });
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

    console.info("[api/projects][POST] site profile generated", {
      hardinessZone: profile.hardinessZone,
      precipitationBand: profile.precipitationBand,
      lotAreaSqm: profile.lotAreaSqm
    });

    console.info("[api/projects][POST] creating project row", { name: input.name, latitude: input.latitude, longitude: input.longitude });

    const project = await prisma.project.create({
      data: {
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        boundaryGeoJson: input.boundary ? JSON.stringify(input.boundary) : null,
        shadeGeoJson: input.shadeZones ? JSON.stringify(input.shadeZones) : null,
        structuresJson:
          input.structures || input.circles
            ? JSON.stringify({ structures: input.structures ?? [], circles: input.circles ?? [] })
            : null,
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
  } catch (error) {
    console.error("[api/projects][POST] unexpected error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") {
      return jsonError(`Unexpected server error while creating project: ${message}`, 500);
    }
    return jsonError("Unexpected server error while creating project.", 500);
  }
}
