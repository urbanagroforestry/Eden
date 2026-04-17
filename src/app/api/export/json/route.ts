import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("projectId");
  if (!id) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  const project = await prisma.project.findUnique({ where: { id }, include: { siteProfile: true, preferences: true, layoutItems: true, assets: true } });
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  return new NextResponse(JSON.stringify(project, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${project.name.replace(/\s+/g, "-")}.json"`
    }
  });
}
