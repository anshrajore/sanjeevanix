import donorsRaw from "@/data/donors.json";
import hospitalsRaw from "@/data/hospitals.json";

import { RADIUS_OPTIONS_KM, getCityCenter, haversineKm, type GeoPoint } from "./geo";

export type BloodGroup = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
export type DonorLanguage =
  | "Any"
  | "Hindi"
  | "Tamil"
  | "Telugu"
  | "Marathi"
  | "Gujarati"
  | "English";
export type OutreachStatus = "available" | "contacted" | "confirmed" | "en-route" | "declined";
export type Urgency = "Critical" | "High" | "Medium" | "Scheduled";

export type DonorRecord = {
  donor_id: string;
  donor_name: string;
  blood_group: BloodGroup;
  city: string;
  area: string;
  pincode: string;
  latitude: number;
  longitude: number;
  willing_radius_km: number;
  last_donation_date: string;
  trust_score: number;
  phone: string;
  language: DonorLanguage;
  status: string;
  availability_score: number;
  acceptance_prediction: number;
  response_rate: number;
  donation_reliability: number;
  fatigue_score: number;
};

export type DonorMatch = DonorRecord & {
  distanceKm: number;
  matchScore: number;
  daysSinceDonation: number;
  etaMinutes: number;
  outreachStatus: OutreachStatus;
};

export type MatchRequest = {
  bloodGroup: BloodGroup;
  city: string;
  language: DonorLanguage;
  minTrustScore: number;
  minAvailability: number;
  maxFatigue: number;
  minDaysSinceDonation: number;
  maxRadiusKm: number;
  autoExpandRadius: boolean;
  urgency: Urgency;
  origin: GeoPoint;
};

export type HospitalRecord = {
  hospital_id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  contact: string;
} & Record<BloodGroup, number>;

export type MatchResult = {
  requestId: string;
  matchedAt: string;
  donors: DonorMatch[];
  radiusUsedKm: number;
  expanded: boolean;
  stats: {
    totalScanned: number;
    compatible: number;
    inRadius: number;
    inCity: number;
    avgTrust: number;
    avgAvailability: number;
    avgDistance: number;
  };
};

const COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  "O+": ["O+", "O-"],
  "O-": ["O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
};

export const HOSPITALS: HospitalRecord[] = hospitalsRaw as HospitalRecord[];

const DONOR_DB: DonorRecord[] = (donorsRaw as Array<Record<string, string>>).map((row) => ({
  donor_id: row.donor_id,
  donor_name: row.donor_name,
  blood_group: row.blood_group as BloodGroup,
  city: row.city,
  area: row.area ?? "",
  pincode: row.pincode ?? "",
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  willing_radius_km: Number(row.willing_radius_km ?? 15),
  last_donation_date: row.last_donation_date,
  trust_score: Number(row.trust_score),
  phone: row.phone,
  language: row.language as DonorLanguage,
  status: row.status,
  availability_score: Number(row.availability_score),
  acceptance_prediction: Number(row.acceptance_prediction),
  response_rate: Number(row.response_rate),
  donation_reliability: Number(row.donation_reliability),
  fatigue_score: Number(row.fatigue_score),
}));

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

function etaMinutes(distanceKm: number): number {
  return Math.max(5, Math.round((distanceKm / 25) * 60));
}

function urgencyWeight(urgency: Urgency): number {
  switch (urgency) {
    case "Critical":
      return 1.12;
    case "High":
      return 1.06;
    case "Medium":
      return 1;
    default:
      return 0.96;
  }
}

function matchScore(donor: DonorRecord, distanceKm: number, request: MatchRequest): number {
  const days = daysSince(donor.last_donation_date);
  const recencyBonus = Math.min(100, days);
  const fatigueBonus = Math.max(0, 100 - donor.fatigue_score * 2);
  const distanceScore = Math.max(0, 100 - distanceKm * 0.8);

  const base =
    (donor.trust_score +
      donor.availability_score +
      donor.acceptance_prediction +
      donor.response_rate +
      donor.donation_reliability +
      distanceScore +
      recencyBonus +
      fatigueBonus) /
    8;

  return Math.round(base * urgencyWeight(request.urgency));
}

function filterPool(request: MatchRequest, radiusKm: number) {
  const compatibleGroups = COMPATIBILITY[request.bloodGroup];

  return DONOR_DB.filter((d) => {
    if (d.status !== "active") return false;
    if (!compatibleGroups.includes(d.blood_group)) return false;
    if (d.trust_score < request.minTrustScore) return false;
    if (d.availability_score < request.minAvailability) return false;
    if (d.fatigue_score > request.maxFatigue) return false;
    if (daysSince(d.last_donation_date) < request.minDaysSinceDonation) return false;
    if (request.language !== "Any" && d.language !== request.language) return false;
    const dist = haversineKm(request.origin, { lat: d.latitude, lng: d.longitude });
    if (dist > radiusKm) return false;
    if (dist > d.willing_radius_km + radiusKm * 0.5) return false;
    return true;
  });
}

function rankPool(pool: DonorRecord[], request: MatchRequest, limit: number): DonorMatch[] {
  return pool
    .map((donor) => {
      const distanceKm = haversineKm(request.origin, {
        lat: donor.latitude,
        lng: donor.longitude,
      });
      return {
        ...donor,
        distanceKm,
        matchScore: matchScore(donor, distanceKm, request),
        daysSinceDonation: daysSince(donor.last_donation_date),
        etaMinutes: etaMinutes(distanceKm),
        outreachStatus: "available" as OutreachStatus,
      };
    })
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return b.matchScore - a.matchScore;
    })
    .slice(0, limit)
    .map((donor, index) => ({
      ...donor,
      outreachStatus: (index === 0 ? "contacted" : "available") as OutreachStatus,
    }));
}

export function runDonorMatch(request: MatchRequest, limit = 12): MatchResult {
  let radiusUsed = request.maxRadiusKm;
  let pool = filterPool(request, radiusUsed);
  let expanded = false;

  if (pool.length === 0 && request.autoExpandRadius) {
    for (const r of RADIUS_OPTIONS_KM) {
      if (r <= request.maxRadiusKm) continue;
      pool = filterPool(request, r);
      if (pool.length > 0) {
        radiusUsed = r;
        expanded = true;
        break;
      }
    }
  }

  const ranked = rankPool(pool, request, limit);
  const inCity = ranked.filter((d) => d.city === request.city).length;

  return {
    requestId: `MATCH-${Date.now().toString(36).toUpperCase()}`,
    matchedAt: new Date().toISOString(),
    donors: ranked,
    radiusUsedKm: radiusUsed,
    expanded,
    stats: {
      totalScanned: DONOR_DB.length,
      compatible: DONOR_DB.filter((d) => COMPATIBILITY[request.bloodGroup].includes(d.blood_group))
        .length,
      inRadius: pool.length,
      inCity,
      avgTrust:
        ranked.length > 0
          ? Math.round(ranked.reduce((s, d) => s + d.trust_score, 0) / ranked.length)
          : 0,
      avgAvailability:
        ranked.length > 0
          ? Math.round(ranked.reduce((s, d) => s + d.availability_score, 0) / ranked.length)
          : 0,
      avgDistance:
        ranked.length > 0
          ? Math.round((ranked.reduce((s, d) => s + d.distanceKm, 0) / ranked.length) * 10) / 10
          : 0,
    },
  };
}

export function getHospitalsInCity(city: string): HospitalRecord[] {
  return HOSPITALS.filter((h) => h.city === city);
}

export function getDonorsNearPoint(point: GeoPoint, radiusKm: number, bloodGroup?: BloodGroup) {
  const groups = bloodGroup ? COMPATIBILITY[bloodGroup] : null;
  return DONOR_DB.filter((d) => {
    if (d.status !== "active") return false;
    if (groups && !groups.includes(d.blood_group)) return false;
    return haversineKm(point, { lat: d.latitude, lng: d.longitude }) <= radiusKm;
  });
}

export function advanceOutreachStatus(current: OutreachStatus): OutreachStatus {
  switch (current) {
    case "available":
      return "contacted";
    case "contacted":
      return "confirmed";
    case "confirmed":
      return "en-route";
    default:
      return current;
  }
}

export function defaultMatchOrigin(city: string): GeoPoint {
  return getCityCenter(city);
}

export const BLOOD_GROUPS: BloodGroup[] = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
export const CITIES = [
  "Mumbai",
  "Mumbai Metro",
  "Thane",
  "Pune",
  "Nashik",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Delhi",
  "Ahmedabad",
  "Nagpur",
] as const;
export const LANGUAGES: DonorLanguage[] = [
  "Any",
  "Hindi",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "English",
];
export const URGENCIES: Urgency[] = ["Critical", "High", "Medium", "Scheduled"];
export { RADIUS_OPTIONS_KM };
