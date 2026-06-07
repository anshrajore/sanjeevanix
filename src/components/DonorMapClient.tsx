import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { DonorMapProps, MapDonorPin } from "./DonorMap";
import { DONOR_COLOR } from "./DonorMap";

export function DonorMapClient({
  center,
  zoom = 12,
  donors = [],
  patients = [],
  hospitals = [],
  origin,
  height = "420px",
  onDonorClick,
}: DonorMapProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 z-0" style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {origin && (
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={10}
            pathOptions={{ color: "#FF4D6D", fillColor: "#E63946", fillOpacity: 0.9, weight: 2 }}
          >
            <Tooltip direction="top" permanent={false}>
              Search origin
            </Tooltip>
          </CircleMarker>
        )}

        {hospitals.map((h) => (
          <CircleMarker
            key={h.id}
            center={[h.lat, h.lng]}
            radius={8}
            pathOptions={{ color: "#60a5fa", fillColor: "#3b82f6", fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{h.name}</strong>
                <br />
                {h.city}
                {h.stock !== undefined && (
                  <>
                    <br />
                    Stock: {h.stock} units
                  </>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {patients.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={11}
            pathOptions={{ color: "#FF4D6D", fillColor: "#FF4D6D", fillOpacity: 0.95, weight: 3 }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{p.name}</strong> · {p.bloodGroup}
                <br />
                {p.hospital} · {p.urgency}
                <br />
                Status: {p.status}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {donors.map((d) => (
          <DonorMarker key={d.id} donor={d} origin={origin} onDonorClick={onDonorClick} />
        ))}
      </MapContainer>
    </div>
  );
}

function DonorMarker({
  donor,
  origin,
  onDonorClick,
}: {
  donor: MapDonorPin;
  origin?: DonorMapProps["origin"];
  onDonorClick?: (id: string) => void;
}) {
  const color = DONOR_COLOR[donor.status];
  const positions: [number, number][] =
    origin && donor.status !== "declined"
      ? [
          [origin.lat, origin.lng],
          [donor.lat, donor.lng],
        ]
      : [];

  return (
    <>
      {positions.length === 2 && (
        <Polyline
          positions={positions}
          pathOptions={{ color, weight: 2, opacity: 0.5, dashArray: "6" }}
        />
      )}
      <CircleMarker
        center={[donor.lat, donor.lng]}
        radius={7}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
        eventHandlers={{
          click: () => onDonorClick?.(donor.id),
        }}
      >
        <Tooltip direction="top">
          {donor.name} · {donor.bloodGroup} · {donor.distanceKm} km
        </Tooltip>
        <Popup>
          <div className="text-sm">
            <strong>{donor.name}</strong> ({donor.bloodGroup})
            <br />
            {donor.distanceKm} km · Score {donor.matchScore ?? "—"}
            <br />
            Status: {donor.status}
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}
