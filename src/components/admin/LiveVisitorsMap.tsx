"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import type { LiveVisitorRow } from "@/services/admin";

const DEFAULT_CENTER: [number, number] = [20, 10];
const DEFAULT_ZOOM = 2;

/**
 * Approximate visitor locations on a world map. Only visitors with a resolved
 * lat/long get a dot — sessions that only fell back to a locale/timezone guess
 * (local dev, or an IP the geo lookup couldn't place) still show in the list
 * above, just without a marker.
 */
export function LiveVisitorsMap({ visitors }: { visitors: LiveVisitorRow[] }) {
  const points = visitors.filter(
    (v): v is LiveVisitorRow & { latitude: number; longitude: number } =>
      typeof v.latitude === "number" && typeof v.longitude === "number",
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "#eef0ec" }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      {points.map((v) => (
        <CircleMarker
          key={v.id}
          center={[v.latitude, v.longitude]}
          radius={6}
          pathOptions={{
            color: v.loggedIn ? "#b08a4a" : "#16233b",
            fillColor: v.loggedIn ? "#b08a4a" : "#16233b",
            fillOpacity: 0.85,
            weight: 1.5,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            <span className="text-xs">
              {v.flag} {v.label}
              {v.city ? ` · ${v.city}` : ""}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
