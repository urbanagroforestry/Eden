import { prisma } from "@/lib/prisma";

export default async function DevPage() {
  if (process.env.NODE_ENV === "production") return <p>Not available in production.</p>;
  const [plantCount, projects] = await Promise.all([
    prisma.plant.count(),
    prisma.project.findMany({ include: { siteProfile: true, preferences: true }, take: 3 })
  ]);

  return (
    <div className="space-y-3 card p-4">
      <h1 className="text-xl font-semibold text-moss">Dev inspector</h1>
      <p className="text-sm">Plant count: {plantCount}</p>
      <pre className="overflow-auto rounded border bg-white p-3 text-xs">{JSON.stringify(projects, null, 2)}</pre>
    </div>
  );
}
