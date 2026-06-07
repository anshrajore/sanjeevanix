import { useEffect, useMemo, useState, type ComponentType } from "react";
import type { BloodGroup } from "@/lib/donor-matching";
import type { OutreachStatus } from "@/lib/donor-matching";
import type { GeoPoint } from "@/lib/geo";

export type MapDonorPin = {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  lat: number;
  lng: number;
  distanceKm: number;
  status: OutreachStatus;
  matchScore?: number;
};

export type MapPatientPin = {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  lat: number;
  lng: number;
  urgency: string;
  hospital: string;
  status: string;
};

export type MapHospitalPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  stock?: number;
};

type DonorMapProps = {
  center: GeoPoint;
  zoom?: number;
  donors?: MapDonorPin[];
  patients?: MapPatientPin[];
  hospitals?: MapHospitalPin[];
  origin?: GeoPoint;
  height?: string;
  onDonorClick?: (id: string) => void;
};

const DONOR_COLOR: Record<OutreachStatus, string> = {
  available: "#22c55e",
  contacted: "#f97316",
  confirmed: "#06b6d4",
  "en-route": "#a855f7",
  declined: "#6b7280",
};

export function DonorMap({
  center,
  zoom = 12,
  donors = [],
  patients = [],
  hospitals = [],
  origin,
  height = "420px",
  onDonorClick,
}: DonorMapProps) {
  const [MapView, setMapView] = useState<ComponentType<DonorMapProps> | null>(null);

  useEffect(() => {
    import("./DonorMapClient").then((m) => setMapView(() => m.DonorMapClient));
  }, []);

  const props = useMemo(
    () => ({
      center,
      zoom,
      donors,
      patients,
      hospitals,
      origin,
      height,
      onDonorClick,
    }),
    [center, zoom, donors, patients, hospitals, origin, height, onDonorClick],
  );

  if (!MapView) {
    return (
      <div
        className="rounded-2xl border border-white/10 bg-black/40 animate-pulse flex items-center justify-center text-white/40 text-sm"
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }

  return <MapView {...props} />;
}

export { DONOR_COLOR };
