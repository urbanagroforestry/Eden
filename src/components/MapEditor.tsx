"use client";

import { MapContainer, Marker, Polygon, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";

const icon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

type Props = {
  center: [number, number];
  marker: [number, number];
  boundary: [number, number][];
  onMarkerChange: (m: [number, number]) => void;
  onBoundaryChange: (b: [number, number][]) => void;
};

function ClickHandler({ onClick }: { onClick: (p: [number, number]) => void }) {
  useMapEvents({ click: (e) => onClick([e.latlng.lng, e.latlng.lat]) });
  return null;
}

export default function MapEditor({ center, marker, boundary, onMarkerChange, onBoundaryChange }: Props) {
  const polygon = useMemo(() => boundary.map(([lon, lat]) => [lat, lon] as [number, number]), [boundary]);

  return (
    <div className="h-[420px] overflow-hidden rounded-xl border">
      <MapContainer center={[center[1], center[0]]} zoom={17} className="h-full w-full">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker icon={icon} draggable position={[marker[1], marker[0]]} eventHandlers={{ dragend: (e) => { const m = e.target.getLatLng(); onMarkerChange([m.lng, m.lat]); } }} />
        {polygon.length >= 3 && <Polygon positions={polygon} pathOptions={{ color: "#2f855a" }} />}
        <ClickHandler onClick={(p) => onBoundaryChange([...boundary, p])} />
      </MapContainer>
    </div>
  );
}
