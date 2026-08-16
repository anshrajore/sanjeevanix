import { useEffect, useState, type ComponentType } from "react";

export type HospitalPin = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  emergency_phone: string | null;
  capabilities: string[];
  blood_bank_available: boolean;
  verification_status: string;
};

export type HospitalMapProps = {
  hospitals: HospitalPin[];
  height?: string;
  selectedId?: string | null;
  onSelect?: (hospital: HospitalPin) => void;
};

/** Browser-only Leaflet map — loaded after hydration so SSR never sees leaflet. */
export function HospitalMap(props: HospitalMapProps) {
  const [View, setView] = useState<ComponentType<HospitalMapProps> | null>(null);
  useEffect(() => {
    import("./HospitalMapClient").then((m) => setView(() => m.HospitalMapClient));
  }, []);
  if (!View) {
    return (
      <div
        className="rounded-2xl border border-white/10 bg-black/40 animate-pulse flex items-center justify-center text-white/40 text-sm"
        style={{ height: props.height ?? "520px" }}
      >
        Loading hospital network…
      </div>
    );
  }
  return <View {...props} />;
}
