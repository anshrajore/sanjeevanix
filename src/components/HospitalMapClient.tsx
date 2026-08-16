import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { HospitalMapProps } from "./HospitalMap";

export function HospitalMapClient({
  hospitals,
  height = "520px",
  selectedId,
  onSelect,
}: HospitalMapProps) {
  const focus = hospitals.find((h) => h.id === selectedId) ?? hospitals[0];
  const center: [number, number] = focus ? [focus.latitude, focus.longitude] : [22.5, 79];

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 z-0" style={{ height }}>
      <MapContainer
        center={center}
        zoom={focus && selectedId ? 11 : 5}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {hospitals.map((h) => {
          const verified = h.verification_status === "verified";
          return (
            <CircleMarker
              key={h.id}
              center={[h.latitude, h.longitude]}
              radius={h.id === selectedId ? 12 : 7}
              eventHandlers={{ click: () => onSelect?.(h) }}
              pathOptions={{
                color: verified ? "#34D399" : "#FBBF24",
                fillColor: verified ? "#059669" : "#D97706",
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Tooltip direction="top">{h.name}</Tooltip>
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <strong>{h.name}</strong>
                  <div>{h.address ?? "Address on file with hospital"}</div>
                  <div>
                    {h.city}, {h.state} · {h.country}
                  </div>
                  {h.phone && <div>Switchboard: {h.phone}</div>}
                  {h.emergency_phone && <div>Emergency: {h.emergency_phone}</div>}
                  <div>{verified ? "Verified partner" : "Unverified listing"}</div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
