"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BoundaryTools } from "@/components/BoundaryTools";
import { LayoutItemRecord, ProjectRecord, RecommendationResponse } from "@/lib/contracts";

const MapEditor = dynamic(() => import("@/components/MapEditor"), { ssr: false });

async function fetchRecommendation(projectId: string): Promise<RecommendationResponse> {
  const r = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }) });
  if (!r.ok) throw new Error("Recommendation failed");
  return r.json();
}

export default function DesignDetailPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [boundary, setBoundary] = useState<[number, number][]>([]);
  const [shade, setShade] = useState<{ id: string; level: "full-sun" | "part-shade" | "shade"; points: [number, number][] }[]>([]);
  const [rec, setRec] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [layoutItems, setLayoutItems] = useState<LayoutItemRecord[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (!res.ok) throw new Error("Unable to load project");
        const data: ProjectRecord = await res.json();
        setProject(data);
        setBoundary(data.boundaryGeoJson ? JSON.parse(data.boundaryGeoJson) : []);
        setShade(data.shadeGeoJson ? JSON.parse(data.shadeGeoJson) : []);
        setLayoutItems(data.layoutItems ?? []);
        setRec(await fetchRecommendation(params.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load project");
      }
    })();
  }, [params.id]);

  const siteSummary = useMemo(() => {
    if (!project?.siteProfile) return [];
    const s = project.siteProfile;
    return [
      `Hardiness proxy ${s.hardinessZone} (${s.hardinessConfidence})`,
      `Precipitation proxy ${s.precipitationBand} (${s.precipitationConf})`,
      `Slope/aspect ${s.slopeAspect} (${s.slopeConfidence})`
    ];
  }, [project]);

  async function saveEdits() {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boundaryGeoJson: JSON.stringify(boundary), shadeGeoJson: JSON.stringify(shade), structuresJson: JSON.stringify([]) })
    });
    if (!res.ok) setError("Failed to save edits");
  }

  async function generateLayoutPlan() {
    const res = await fetch("/api/layout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: params.id }) });
    if (!res.ok) {
      setError("Layout generation failed");
      return;
    }
    const pRes = await fetch(`/api/projects/${params.id}`);
    const data: ProjectRecord = await pRes.json();
    setLayoutItems(data.layoutItems ?? []);
  }

  async function shiftItem(id: string, lat: number, lon: number) {
    await fetch(`/api/layout/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat, lon, radiusMeters: 2 }) });
    setLayoutItems((prev) => prev.map((item) => (item.id === id ? { ...item, lat, lon } : item)));
  }

  async function deleteItem(id: string) {
    await fetch(`/api/layout/${id}`, { method: "DELETE" });
    setLayoutItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (!project && !error) return <p>Loading design...</p>;
  if (error && !project) return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-moss">{project?.name}</h1>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <MapEditor center={[project!.longitude, project!.latitude]} marker={[project!.longitude, project!.latitude]} boundary={boundary} onMarkerChange={() => {}} onBoundaryChange={setBoundary} />
          <BoundaryTools onUndo={() => setBoundary(boundary.slice(0, -1))} onClear={() => setBoundary([])} />
          <div className="card p-4">
            <h3 className="font-semibold">Shade refinement</h3>
            <p className="text-sm text-bark/70">Manual shade entries are treated as user-corrected and prioritized over inferred light distribution.</p>
            <div className="mt-2 flex gap-2">
              {(["full-sun", "part-shade", "shade"] as const).map((level) => (
                <button key={level} className="rounded border px-2 py-1 text-xs" onClick={() => setShade([...shade, { id: crypto.randomUUID(), level, points: [[project!.longitude, project!.latitude]] }])}>{level}</button>
              ))}
            </div>
            <ul className="mt-2 text-xs">{shade.map((s) => <li key={s.id}>{s.level} zone</li>)}</ul>
          </div>
        </div>
        <aside className="space-y-3">
          <section className="card p-4"><h3 className="font-semibold">Site summary</h3><ul className="mt-2 text-sm space-y-1">{siteSummary.map((s) => <li key={s}>• {s}</li>)}</ul><p className="mt-2 text-xs">Badges: inferred, user-corrected, high/medium/verify.</p></section>
          <section className="card p-4 text-sm"><h3 className="font-semibold">Exports</h3><div className="mt-2 flex flex-col gap-2"><a className="rounded border px-2 py-1" href={`/api/export/pdf?projectId=${params.id}`}>Export PDF concept plan</a><a className="rounded border px-2 py-1" href={`/api/export/json?projectId=${params.id}`}>Export JSON</a><button className="rounded border px-2 py-1 text-left" onClick={() => window.print()}>Printable checklist</button></div></section>
        </aside>
      </div>

      <section className="card p-4 space-y-3">
        <div className="flex justify-end"><button className="rounded border px-3 py-1" onClick={generateLayoutPlan}>Generate layout overlays</button></div>
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Recommendations by 7 layers</h2><button className="rounded bg-moss px-3 py-1 text-white" onClick={async () => setRec(await fetchRecommendation(params.id))}>Regenerate</button></div>
        {!rec ? <p>Generating...</p> : (
          <>
            {rec.byLayer.map((layer) => (
              <article key={layer.layer} className="rounded border p-3">
                <h3 className="font-semibold">{layer.layer}</h3>
                {layer.warning && <p className="text-xs text-amber-700">{layer.warning}</p>}
                <p className="text-sm mt-1"><strong>Used in concept:</strong> {layer.recommended.map((p) => p.commonName).join(", ") || "None"}</p>
                <p className="text-sm"><strong>Alternatives:</strong> {layer.alternatives.map((p) => p.commonName).join(", ") || "None"}</p>
                <ul className="mt-1 text-xs text-bark/70">{layer.recommendedRationales.map((reason) => <li key={reason}>• {reason}</li>)}</ul>
              </article>
            ))}
            <article className="rounded border p-3">
              <h3 className="font-semibold">Support species</h3>
              <p className="text-sm">{rec.supportSpecies.map((p) => `${p.commonName} (${p.supportRole || "support"})`).join(", ") || "None"}</p>
            </article>
            <article className="rounded border p-3"><h3 className="font-semibold">Rationale + confidence</h3><ul className="text-sm mt-1">{rec.rationale.map((r) => <li key={r}>• {r}</li>)}</ul><p className="text-xs mt-1">Overall confidence: {rec.confidence}</p><p className="text-xs">Maintenance estimate: {rec.maintenanceEstimate}</p></article>
            <article className="rounded border p-3"><h3 className="font-semibold">Phased install plan</h3><ul className="text-sm">{rec.phasedPlan.map((p) => <li key={p}>• {p}</li>)}</ul></article>
          </>
        )}
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Concept layout items</h2>
        <div className="mt-2 space-y-2 text-sm">
          {layoutItems.length === 0 && <p>No layout items yet. Generate layout overlays.</p>}
          {layoutItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border p-2">
              <span>{item.label} · {item.layer} · {item.zoneType}</span>
              <div className="flex gap-1">
                <button className="rounded border px-2" onClick={() => shiftItem(item.id, item.lat + 0.00003, item.lon)}>Nudge N</button>
                <button className="rounded border px-2" onClick={() => shiftItem(item.id, item.lat, item.lon + 0.00003)}>Nudge E</button>
                <button className="rounded border px-2" onClick={() => deleteItem(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Concept planning disclaimer: not legal, engineering, utility locate, or stamped landscape architecture advice.</section>

      {error && <p className="text-red-700 text-sm">{error}</p>}
      <button className="rounded bg-moss px-4 py-2 text-white" onClick={saveEdits}>Save map + shade edits</button>
    </div>
  );
}
