import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recommendPlants } from "@/lib/recommendation-engine";
import { getTemplate } from "@/lib/templates";
import { generateLayout } from "@/lib/layout";

export async function POST(req: Request) {
  const { projectId } = await req.json();
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { siteProfile: true, preferences: true } });
  if (!project?.siteProfile || !project.preferences) return NextResponse.json({ error: "missing data" }, { status: 400 });
  const boundary = project.boundaryGeoJson ? JSON.parse(project.boundaryGeoJson) : [];
  if (!boundary.length) return NextResponse.json({ error: "Boundary required for layout." }, { status: 400 });

  const plants = await prisma.plant.findMany();
  const rec = recommendPlants({
    plants,
    site: {
      lotAreaSqm: project.siteProfile.lotAreaSqm,
      hardinessZone: project.siteProfile.hardinessZone,
      hardinessConfidence: project.siteProfile.hardinessConfidence,
      precipitationBand: project.siteProfile.precipitationBand,
      precipitationConf: project.siteProfile.precipitationConf,
      sunExposure: JSON.parse(project.siteProfile.sunExposureJson),
      slopeAspect: project.siteProfile.slopeAspect,
      slopeConfidence: project.siteProfile.slopeConfidence,
      zoneAreas: JSON.parse(project.siteProfile.zoneAreasJson)
    },
    prefs: {
      goals: JSON.parse(project.preferences.goals),
      maintenanceTolerance: project.preferences.maintenanceTolerance,
      irrigationTolerance: project.preferences.irrigationTolerance,
      stylePreference: project.preferences.stylePreference,
      householdPriorities: JSON.parse(project.preferences.householdPriorities),
      constraints: JSON.parse(project.preferences.constraints)
    },
    template: getTemplate(project.preferences.templateKey)
  });

  await prisma.layoutItem.deleteMany({ where: { projectId } });
  const generated = generateLayout(boundary, rec.byLayer.map((x) => ({ layer: x.layer, names: x.recommended.map((p) => p.commonName) })));
  await prisma.layoutItem.createMany({ data: generated.map((g) => ({ ...g, projectId })) });

  return NextResponse.json({ count: generated.length });
}
