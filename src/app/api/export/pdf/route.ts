import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildConceptPdf } from "@/lib/export";
import { recommendPlants } from "@/lib/recommendation-engine";
import { getTemplate } from "@/lib/templates";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("projectId");
  if (!id) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  const project = await prisma.project.findUnique({ where: { id }, include: { siteProfile: true, preferences: true } });
  if (!project?.siteProfile || !project.preferences) return NextResponse.json({ error: "Project missing data" }, { status: 400 });

  const plants = await prisma.plant.findMany();
  const result = recommendPlants({
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

  const buffer = await buildConceptPdf({
    projectName: project.name,
    siteSummary: [`Hardiness proxy: ${project.siteProfile.hardinessZone}`, `Precipitation proxy: ${project.siteProfile.precipitationBand}`, `Lot area: ${Math.round(project.siteProfile.lotAreaSqm)} sqm`],
    layers: result.byLayer.map((x) => ({ layer: x.layer, plants: x.recommended.map((p) => p.commonName) })),
    support: result.supportSpecies.map((p) => p.commonName),
    phasedPlan: result.phasedPlan
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${project.name.replace(/\s+/g, "-")}-concept.pdf"`
    }
  });
}
