import { useEffect, useState, type ComponentType } from "react";

export type CityRisk = {
  city: string;
  lat: number;
  lng: number;
  risk: number;
  available: number;
  pending: number;
};

export type RiskMapProps = {
  cities: CityRisk[];
  height?: string;
  onCityClick?: (city: string) => void;
};

export function RiskMap(props: RiskMapProps) {
  const [View, setView] = useState<ComponentType<RiskMapProps> | null>(null);
  useEffect(() => {
    import("./RiskMapClient").then((m) => setView(() => m.RiskMapClient));
  }, []);
  if (!View) {
    return (
      <div
        className="rounded-2xl border border-white/10 bg-black/40 animate-pulse flex items-center justify-center text-white/40 text-sm"
        style={{ height: props.height ?? "500px" }}
      >
        Loading risk map…
      </div>
    );
  }
  return <View {...props} />;
}
