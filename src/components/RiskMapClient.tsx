import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { riskColor, riskLabel } from "@/lib/bloodbridge";
import type { RiskMapProps } from "./RiskMap";

export function RiskMapClient({ cities, height = "500px", onCityClick }: RiskMapProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 z-0" style={{ height }}>
      <MapContainer
        center={[22.5, 79]}
        zoom={5}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {cities.map((c) => {
          const color = riskColor(c.risk);
          const radius = Math.min(40, Math.max(14, 14 + c.pending * 3));
          return (
            <CircleMarker
              key={c.city}
              center={[c.lat, c.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.35,
                weight: 2,
              }}
              eventHandlers={{ click: () => onCityClick?.(c.city) }}
            >
              <Tooltip direction="top">
                <div className="text-xs">
                  <div className="font-bold">{c.city}</div>
                  <div>Status: {riskLabel(c.risk)}</div>
                  <div>Risk: {c.risk.toFixed(2)}</div>
                  <div>Donors avail: {c.available}</div>
                  <div>Open requests: {c.pending}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
