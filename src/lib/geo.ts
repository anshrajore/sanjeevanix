export type GeoPoint = { lat: number; lng: number };

/** City center coordinates for map focus and fallback geocoding. */
export const CITY_CENTERS: Record<string, GeoPoint> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  "Mumbai Metro": { lat: 19.0176, lng: 72.8562 },
  Thane: { lat: 19.2183, lng: 72.9781 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Nashik: { lat: 19.9975, lng: 73.7898 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
};

export const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100, 200] as const;

/** Spread donors around a city center using a stable offset from donor id. */
export function donorCoordinates(city: string, donorId: string): GeoPoint & { area: string } {
  const center = CITY_CENTERS[city] ?? CITY_CENTERS.Mumbai;
  const n = parseInt(donorId.replace(/\D/g, ""), 10) || 1;
  const angle = ((n * 137.508) % 360) * (Math.PI / 180);
  const radiusDeg = 0.02 + (n % 12) * 0.008;
  const areas = ["Central", "North", "South", "East", "West", "Metro"];
  return {
    lat: center.lat + Math.cos(angle) * radiusDeg,
    lng: center.lng + Math.sin(angle) * radiusDeg,
    area: areas[n % areas.length],
  };
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

export function etaMinutes(distanceKm: number): number {
  return Math.max(5, Math.round((distanceKm / 25) * 60));
}

export function getCityCenter(city: string): GeoPoint {
  return CITY_CENTERS[city] ?? CITY_CENTERS.Mumbai;
}

export function getCurrentPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export function nearestCity(point: GeoPoint): string {
  let best = "Mumbai";
  let bestDist = Infinity;
  for (const [city, center] of Object.entries(CITY_CENTERS)) {
    const d = haversineKm(point, center);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}
