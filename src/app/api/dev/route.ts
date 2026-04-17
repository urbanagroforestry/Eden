import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Unavailable in production" }, { status: 404 });
  const [plantCount, projects] = await Promise.all([
    prisma.plant.count(),
    prisma.project.findMany({ include: { siteProfile: true, preferences: true }, take: 5 })
  ]);
  return NextResponse.json({ plantCount, projects });
}
