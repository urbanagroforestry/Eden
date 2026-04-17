import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.layoutItem.update({ where: { id }, data: { lat: body.lat, lon: body.lon, radiusMeters: body.radiusMeters } });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.layoutItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
