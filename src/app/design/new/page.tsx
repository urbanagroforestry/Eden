"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { areaFromBoundary, isValidBoundary } from "@/lib/geo";
import { DESIGN_TEMPLATES } from "@/lib/templates";
import { ProjectRecord } from "@/lib/contracts";
import type { MapAnnotation, MapCircle, MapTool } from "@/components/MapEditor";

const MapEditor = dynamic(() => import("@/components/MapEditor"), { ssr: false });

const GOALS = ["foodProduction", "biodiversity", "pollinators", "beauty", "privacy", "stormwater", "coolingShade"];
const HOUSEHOLD = ["fruit", "nuts", "herbs", "rootCrops", "habitat", "childFriendly"];
const CONSTRAINTS = ["hoaTidyFrontYard", "avoidMessyFruitNearWalkway", "avoidLargeRootsNearFoundation", "pets", "kids"];

const initialPrefs = {
  goals: ["foodProduction", "biodiversity"],
  maintenanceTolerance: "medium",
  irrigationTolerance: "medium",
  stylePreference: "balanced",
  householdPriorities: ["fruit", "herbs"],
  constraints: ["avoidLargeRootsNearFoundation"],
  templateKey: "balanced-suburban"
};

const toggleInArray = (arr: string[], value: string) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

type ApiErrorShape = { error?: string | { message?: string }; message?: string };

const isJsonResponse = (response: Response) => (response.headers.get("content-type") || "").includes("application/json");

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;

  if (isJsonResponse(response)) {
    try {
      const body = (await response.json()) as ApiErrorShape;
      if (typeof body.error === "string") return body.error;
      if (typeof body.error === "object" && body.error?.message) return body.error.message;
      if (typeof body.message === "string") return body.message;
      return fallback;
    } catch {
      return fallback;
    }
  }

  try {
    const text = (await response.text()).trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export default function NewDesignPage() {
  const router = useRouter();
  const [name, setName] = useState("My Food Forest Design");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ displayName: string; lat: number; lon: number }[]>([]);
  const [marker, setMarker] = useState<[number, number]>([-97.7431, 30.2672]);
  const [boundary, setBoundary] = useState<[number, number][]>([]);
  const [circles, setCircles] = useState<MapCircle[]>([]);
  const [annotations, setAnnotations] = useState<MapAnnotation[]>([]);
  const [activeTool, setActiveTool] = useState<MapTool>("draw-polygon");
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState(initialPrefs);
  const [existing, setExisting] = useState<ProjectRecord[]>([]);
  const [importText, setImportText] = useState("");

  const area = useMemo(() => Math.round(areaFromBoundary(boundary)), [boundary]);

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then((d: ProjectRecord[]) => setExisting(d)).catch(() => []);
  }, []);

  async function searchAddress() {
    setError("");
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    if (data.fallback) setError(data.fallback);
  }

  async function importProject() {
    try {
      const parsed = JSON.parse(importText);
      const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const p: ProjectRecord = await res.json();
      router.push(`/design/${p.id}`);
    } catch {
      setError("Import failed. Ensure valid JSON export payload.");
    }
  }

  async function createProject() {
    const check = isValidBoundary(boundary);
    if (!check.valid) {
      setError(check.reason || "Invalid boundary");
      return;
    }

    const shadeZones = annotations
      .filter((annotation) => annotation.type === "full-sun" || annotation.type === "part-shade" || annotation.type === "shade")
      .map((annotation) => ({ id: annotation.id, level: annotation.type, points: [annotation.point] }));

    const structures = annotations
      .filter((annotation) => annotation.type === "structure" || annotation.type === "existing-tree")
      .map((annotation) => ({ id: annotation.id, type: annotation.type, point: annotation.point }));

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        latitude: marker[1],
        longitude: marker[0],
        boundary,
        preferences: prefs,
        shadeZones,
        structures,
        circles
      })
    });

    if (!res.ok) {
      setError(await readErrorMessage(res));
      return;
    }

    if (!isJsonResponse(res)) {
      setError("Project creation failed: expected JSON response from server.");
      return;
    }

    const project: ProjectRecord = await res.json();
    router.push(`/design/${project.id}`);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-moss">Start a new food forest design</h1>
      <section className="card p-4 space-y-3">
        <label className="block text-sm">Project name<input className="mt-1 w-full rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="flex gap-2"><input className="flex-1 rounded border p-2" placeholder="Search U.S. address" value={query} onChange={(e) => setQuery(e.target.value)} /><button onClick={searchAddress} className="rounded bg-moss px-3 py-2 text-white">Search</button></div>
        {results.length > 0 && <ul className="max-h-36 overflow-auto rounded border bg-white text-sm">{results.map((r) => <li key={r.displayName}><button className="w-full p-2 text-left hover:bg-emerald-50" onClick={() => setMarker([r.lon, r.lat])}>{r.displayName}</button></li>)}</ul>}
        <p className="text-xs text-bark/70">If geocoding fails, drag the marker manually and proceed.</p>
      </section>

      <MapEditor
        center={marker}
        marker={marker}
        boundary={boundary}
        circles={circles}
        annotations={annotations}
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onMarkerChange={setMarker}
        onBoundaryChange={setBoundary}
        onCirclesChange={setCircles}
        onAnnotationsChange={setAnnotations}
      />

      <section className="card p-4 grid gap-3 md:grid-cols-2">
        <p className="text-sm">Lot area estimate: <strong>{area || 0} sqm</strong></p>
        <p className="text-sm">Boundary points: <strong>{boundary.length}</strong> • Circle zones: <strong>{circles.length}</strong> • Annotations: <strong>{annotations.length}</strong></p>
        <label className="text-sm">Design template<select className="mt-1 w-full rounded border p-2" value={prefs.templateKey} onChange={(e) => setPrefs({ ...prefs, templateKey: e.target.value })}>{DESIGN_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}</select></label>
        <label className="text-sm">Maintenance tolerance<select className="mt-1 w-full rounded border p-2" value={prefs.maintenanceTolerance} onChange={(e) => setPrefs({ ...prefs, maintenanceTolerance: e.target.value })}><option>low</option><option>medium</option><option>high</option></select></label>
        <label className="text-sm">Irrigation tolerance<select className="mt-1 w-full rounded border p-2" value={prefs.irrigationTolerance} onChange={(e) => setPrefs({ ...prefs, irrigationTolerance: e.target.value })}><option>low</option><option>medium</option><option>high</option></select></label>
        <label className="text-sm">Style<select className="mt-1 w-full rounded border p-2" value={prefs.stylePreference} onChange={(e) => setPrefs({ ...prefs, stylePreference: e.target.value })}><option>native-heavy</option><option>edible-heavy</option><option>balanced</option><option>tidy-neighborhood-friendly</option></select></label>
      </section>

      <section className="card p-4 grid gap-3 md:grid-cols-3 text-sm">
        <div><p className="font-medium">Design goals</p>{GOALS.map((g) => <label className="mt-1 block" key={g}><input type="checkbox" className="mr-2" checked={prefs.goals.includes(g)} onChange={() => setPrefs({ ...prefs, goals: toggleInArray(prefs.goals, g) })} />{g}</label>)}</div>
        <div><p className="font-medium">Household priorities</p>{HOUSEHOLD.map((g) => <label className="mt-1 block" key={g}><input type="checkbox" className="mr-2" checked={prefs.householdPriorities.includes(g)} onChange={() => setPrefs({ ...prefs, householdPriorities: toggleInArray(prefs.householdPriorities, g) })} />{g}</label>)}</div>
        <div><p className="font-medium">Constraints</p>{CONSTRAINTS.map((g) => <label className="mt-1 block" key={g}><input type="checkbox" className="mr-2" checked={prefs.constraints.includes(g)} onChange={() => setPrefs({ ...prefs, constraints: toggleInArray(prefs.constraints, g) })} />{g}</label>)}</div>
      </section>

      {error && <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <button onClick={createProject} className="rounded bg-moss px-5 py-2 text-white">Generate concept plan</button>

      <section className="card p-4">
        <h2 className="font-semibold">Reopen demo projects</h2>
        <ul className="mt-2 space-y-1 text-sm">{existing.slice(0, 6).map((p) => <li key={p.id}><a className="text-moss underline" href={`/design/${p.id}`}>{p.name}</a></li>)}</ul>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">Import project JSON</h2>
        <textarea className="mt-2 h-28 w-full rounded border p-2 text-xs" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste exported JSON here" />
        <button onClick={importProject} className="mt-2 rounded border px-3 py-1">Import</button>
      </section>
    </div>
  );
}
