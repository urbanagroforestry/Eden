import { NextResponse } from "next/server";
import { z } from "zod";

const geocodeResponseSchema = z.array(
  z.object({
    display_name: z.string(),
    lat: z.string(),
    lon: z.string()
  })
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (!q) return NextResponse.json({ results: [] });

  try {
    const search = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=5&q=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": "FoodForestForge/0.1" }
    });
    if (!search.ok) throw new Error("geocode failed");
    const parsed = geocodeResponseSchema.safeParse(await search.json());
    if (!parsed.success) throw new Error("geocode shape mismatch");

    const results = parsed.data.map((r) => ({ displayName: r.display_name, lat: Number(r.lat), lon: Number(r.lon) }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], fallback: "Geocoder unavailable. Drop a pin manually." }, { status: 200 });
  }
}
