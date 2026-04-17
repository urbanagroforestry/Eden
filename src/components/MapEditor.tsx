"use client";

import { Circle, CircleMarker, MapContainer, Marker, Polygon, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export type MapTool =
  | "move"
  | "draw-polygon"
  | "draw-circle"
  | "edit-shape"
  | "delete-shape"
  | "structure"
  | "existing-tree"
  | "full-sun"
  | "part-shade"
  | "shade";

export type MapCircle = {
  id: string;
  center: [number, number];
  radiusMeters: number;
};

export type MapAnnotation = {
  id: string;
  type: "structure" | "existing-tree" | "full-sun" | "part-shade" | "shade";
  point: [number, number];
};

type Props = {
  center: [number, number];
  marker: [number, number];
  boundary: [number, number][];
  circles: MapCircle[];
  annotations: MapAnnotation[];
  activeTool: MapTool;
  onToolChange: (tool: MapTool) => void;
  onMarkerChange: (m: [number, number]) => void;
  onBoundaryChange: (b: [number, number][]) => void;
  onCirclesChange: (circles: MapCircle[]) => void;
  onAnnotationsChange: (annotations: MapAnnotation[]) => void;
};

const MAIN_TOOLS: { key: MapTool; label: string }[] = [
  { key: "move", label: "Move" },
  { key: "draw-polygon", label: "Draw Polygon" },
  { key: "draw-circle", label: "Draw Radius/Circle" },
  { key: "edit-shape", label: "Edit Shape" },
  { key: "delete-shape", label: "Delete Shape" }
];

const ANNOTATION_TOOLS: { key: MapTool; label: string }[] = [
  { key: "structure", label: "Structure" },
  { key: "existing-tree", label: "Existing Tree" },
  { key: "full-sun", label: "Full Sun" },
  { key: "part-shade", label: "Part Shade" },
  { key: "shade", label: "Shade" }
];

const annotationColor: Record<MapAnnotation["type"], string> = {
  structure: "#7c3aed",
  "existing-tree": "#166534",
  "full-sun": "#f59e0b",
  "part-shade": "#0ea5e9",
  shade: "#334155"
};

const toolHint: Record<MapTool, string> = {
  move: "Drag the marker or click map to reposition the site point.",
  "draw-polygon": "Click map to add boundary vertices in order.",
  "draw-circle": "Click map to place a radius zone.",
  "edit-shape": "Click map to move nearest boundary vertex.",
  "delete-shape": "Click map to remove nearest boundary vertex/circle/annotation.",
  structure: "Click map to place a structure marker.",
  "existing-tree": "Click map to place an existing tree marker.",
  "full-sun": "Click map to annotate full-sun area.",
  "part-shade": "Click map to annotate part-shade area.",
  shade: "Click map to annotate shade area."
};

const distanceSquared = (a: [number, number], b: [number, number]) => {
  const dLon = a[0] - b[0];
  const dLat = a[1] - b[1];
  return dLon * dLon + dLat * dLat;
};

function MapClickHandler({
  activeTool,
  marker,
  boundary,
  circles,
  annotations,
  onMarkerChange,
  onBoundaryChange,
  onCirclesChange,
  onAnnotationsChange
}: Omit<Props, "center" | "onToolChange">) {
  useMapEvents({
    click: (e) => {
      const point: [number, number] = [e.latlng.lng, e.latlng.lat];

      if (activeTool === "move") {
        onMarkerChange(point);
        return;
      }

      if (activeTool === "draw-polygon") {
        onBoundaryChange([...boundary, point]);
        return;
      }

      if (activeTool === "draw-circle") {
        onCirclesChange([...circles, { id: crypto.randomUUID(), center: point, radiusMeters: 8 }]);
        return;
      }

      if (activeTool === "edit-shape") {
        if (boundary.length === 0) return;
        let nearestIndex = 0;
        let nearest = Number.POSITIVE_INFINITY;
        boundary.forEach((vertex, idx) => {
          const d = distanceSquared(vertex, point);
          if (d < nearest) {
            nearest = d;
            nearestIndex = idx;
          }
        });
        onBoundaryChange(boundary.map((vertex, idx) => (idx === nearestIndex ? point : vertex)));
        return;
      }

      if (activeTool === "delete-shape") {
        const boundaryCandidate = boundary
          .map((vertex, idx) => ({ idx, d: distanceSquared(vertex, point), type: "boundary" as const }))
          .sort((a, b) => a.d - b.d)[0];

        const circleCandidate = circles
          .map((circle) => ({ id: circle.id, d: distanceSquared(circle.center, point), type: "circle" as const }))
          .sort((a, b) => a.d - b.d)[0];

        const annotationCandidate = annotations
          .map((item) => ({ id: item.id, d: distanceSquared(item.point, point), type: "annotation" as const }))
          .sort((a, b) => a.d - b.d)[0];

        const candidates = [boundaryCandidate, circleCandidate, annotationCandidate].filter(Boolean) as Array<
          | { idx: number; d: number; type: "boundary" }
          | { id: string; d: number; type: "circle" }
          | { id: string; d: number; type: "annotation" }
        >;

        if (candidates.length === 0) return;

        const winner = candidates.sort((a, b) => a.d - b.d)[0];
        if (winner.type === "boundary") onBoundaryChange(boundary.filter((_, idx) => idx !== winner.idx));
        if (winner.type === "circle") onCirclesChange(circles.filter((item) => item.id !== winner.id));
        if (winner.type === "annotation") onAnnotationsChange(annotations.filter((item) => item.id !== winner.id));
        return;
      }

      if (["structure", "existing-tree", "full-sun", "part-shade", "shade"].includes(activeTool)) {
        onAnnotationsChange([
          ...annotations,
          { id: crypto.randomUUID(), type: activeTool as MapAnnotation["type"], point }
        ]);
      }
    }
  });

  return null;
}

function ToolButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
        active ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function MapEditor({
  center,
  marker,
  boundary,
  circles,
  annotations,
  activeTool,
  onToolChange,
  onMarkerChange,
  onBoundaryChange,
  onCirclesChange,
  onAnnotationsChange
}: Props) {
  const polygon = useMemo(() => boundary.map(([lon, lat]) => [lat, lon] as [number, number]), [boundary]);

  return (
    <div className="relative h-[500px] overflow-hidden rounded-xl border">
      <MapContainer center={[center[1], center[0]]} zoom={17} className="h-full w-full">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker
          icon={markerIcon}
          draggable
          position={[marker[1], marker[0]]}
          eventHandlers={{
            dragend: (e) => {
              const m = e.target.getLatLng();
              onMarkerChange([m.lng, m.lat]);
            }
          }}
        />
        {polygon.length >= 3 && <Polygon positions={polygon} pathOptions={{ color: "#2f855a" }} />}
        {circles.map((circle) => (
          <Circle key={circle.id} center={[circle.center[1], circle.center[0]]} radius={circle.radiusMeters} pathOptions={{ color: "#0f766e" }} />
        ))}
        {annotations.map((annotation) => (
          <CircleMarker
            key={annotation.id}
            center={[annotation.point[1], annotation.point[0]]}
            radius={7}
            pathOptions={{ color: annotationColor[annotation.type], fillColor: annotationColor[annotation.type], fillOpacity: 0.9 }}
          >
            <Tooltip>{annotation.type.replace("-", " ")}</Tooltip>
          </CircleMarker>
        ))}

        <MapClickHandler
          activeTool={activeTool}
          marker={marker}
          boundary={boundary}
          circles={circles}
          annotations={annotations}
          onMarkerChange={onMarkerChange}
          onBoundaryChange={onBoundaryChange}
          onCirclesChange={onCirclesChange}
          onAnnotationsChange={onAnnotationsChange}
        />
      </MapContainer>

      <div className="absolute left-3 top-3 z-[1000] w-[280px] rounded-lg border border-emerald-200 bg-white/95 p-2 shadow-lg backdrop-blur">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-900">Map Toolkit</p>
        <div className="grid grid-cols-2 gap-1">
          {MAIN_TOOLS.map((tool) => (
            <ToolButton key={tool.key} label={tool.label} active={activeTool === tool.key} onClick={() => onToolChange(tool.key)} />
          ))}
        </div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-900">Annotations</p>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {ANNOTATION_TOOLS.map((tool) => (
            <ToolButton key={tool.key} label={tool.label} active={activeTool === tool.key} onClick={() => onToolChange(tool.key)} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-emerald-900/80">Active: <strong>{activeTool}</strong></p>
        <p className="text-[11px] text-emerald-900/75">{toolHint[activeTool]}</p>
      </div>
    </div>
  );
}
