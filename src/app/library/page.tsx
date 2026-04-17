import { Layer } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SearchParams = { [key: string]: string | string[] | undefined };

const validLayer = (v?: string): Layer | undefined =>
  v && Object.values(Layer).includes(v as Layer) ? (v as Layer) : undefined;

export default async function LibraryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const layer = validLayer(typeof sp.layer === "string" ? sp.layer : undefined);
  const supportRole = typeof sp.supportRole === "string" ? sp.supportRole : undefined;
  const sun = typeof sp.sun === "string" ? sp.sun : undefined;
  const water = typeof sp.water === "string" ? sp.water : undefined;
  const maintenance = typeof sp.maintenance === "string" ? sp.maintenance : undefined;
  const region = typeof sp.region === "string" ? sp.region : undefined;
  const edibleUse = typeof sp.edibleUse === "string" ? sp.edibleUse : undefined;

  const plants = await prisma.plant.findMany({
    where: {
      layer,
      supportRole: supportRole ? { contains: supportRole } : undefined,
      sunNeeds: sun ? { contains: sun } : undefined,
      waterNeeds: water ? { contains: water } : undefined,
      maintenanceLevel: maintenance ? { contains: maintenance } : undefined,
      regionalTags: region ? { contains: region } : undefined,
      edibleUse: edibleUse ? { contains: edibleUse } : undefined
    },
    take: 300,
    orderBy: { commonName: "asc" }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-moss">Plant library ({plants.length})</h1>
      <form className="card grid gap-3 p-4 md:grid-cols-4">
        <input name="layer" placeholder="layer (CANOPY...)" className="rounded border p-2" defaultValue={layer} />
        <input name="supportRole" placeholder="support role" className="rounded border p-2" defaultValue={supportRole} />
        <input name="sun" placeholder="sun needs" className="rounded border p-2" defaultValue={sun} />
        <input name="water" placeholder="water needs" className="rounded border p-2" defaultValue={water} />
        <input name="maintenance" placeholder="maintenance" className="rounded border p-2" defaultValue={maintenance} />
        <input name="region" placeholder="region tag" className="rounded border p-2" defaultValue={region} />
        <input name="edibleUse" placeholder="edible use" className="rounded border p-2" defaultValue={edibleUse} />
        <button className="rounded bg-moss px-4 py-2 text-white">Apply filters</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {plants.map((p) => (
          <article key={p.id} className="card p-4 text-sm">
            <div className="flex items-center justify-between"><h2 className="font-semibold">{p.commonName}</h2><span className="badge border-emerald-300 bg-emerald-50">{p.layer}</span></div>
            <p className="italic text-bark/70">{p.scientificName}</p>
            <p className="mt-2">Use: {p.edibleUse} • Sun: {p.sunNeeds} • Water: {p.waterNeeds}</p>
            <p>Support role: {p.supportRole ?? "—"} • Region tags: {p.regionalTags} • Maintenance: {p.maintenanceLevel}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
