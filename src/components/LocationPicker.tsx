import { useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { DonorMap } from "@/components/DonorMap";
import { getCityCenter, getCurrentPosition, nearestCity, type GeoPoint } from "@/lib/geo";
import { CITIES } from "@/lib/donor-matching";

type LocationPickerProps = {
  city: string;
  point: GeoPoint;
  onCityChange: (city: string) => void;
  onPointChange: (point: GeoPoint) => void;
};

export function LocationPicker({ city, point, onCityChange, onPointChange }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      onPointChange(pos);
      onCityChange(nearestCity(pos));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get location");
    } finally {
      setLocating(false);
    }
  };

  const handleCityChange = (newCity: string) => {
    onCityChange(newCity);
    onPointChange(getCityCenter(newCity));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
        >
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void handleUseMyLocation()}
          disabled={locating}
          className="glass-red rounded-lg px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-60"
        >
          <Crosshair className="w-4 h-4" />
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      <DonorMap center={point} origin={point} zoom={11} height="220px" />

      <div className="text-xs text-white/40 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        {point.lat.toFixed(4)}, {point.lng.toFixed(4)} · {city}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
