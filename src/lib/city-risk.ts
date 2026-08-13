import donorsRaw from "@/data/donors.json";
import hospitalsRaw from "@/data/hospitals.json";
import requestsRaw from "@/data/requests.json";

import { CITY_CENTERS } from "./geo";

export const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;
export type Group = (typeof BLOOD_GROUPS)[number];

export type RiskLevel = "critical" | "high" | "moderate" | "stable";

export type GroupRisk = {
  group: Group;
  supplyUnits: number;
  demandUnits: number;
  eligibleDonors: number;
  shortage: number;
};

export type CityRisk = {
  city: string;
  region: string;
  totalDonors: number;
  eligibleDonors: number;
  cooldownDonors: number;
  supplyUnits: number;
  demandUnits: number;
  shortage: number;
  thalassemiaLoad: number;
  openRequests: number;
  criticalGroup: Group;
  groups: GroupRisk[];
  level: RiskLevel;
  etaMinutes: number;
  lat: number;
  lng: number;
};

export type RiskSnapshot = {
  updatedAt: number;
  cities: CityRisk[];
  totals: {
    citiesAtRisk: number;
    mobilizableDonors: number;
    supplyUnits: number;
    demandUnits: number;
    thalassemiaLoad: number;
    nationalShortage: number;
  };
};

type DonorRow = Record<string, string | number>;
type HospitalRow = Record<string, string | number>;
type RequestRow = Record<string, string | number | string[]>;

const DONORS = donorsRaw as DonorRow[];
const HOSPITALS = hospitalsRaw as HospitalRow[];
const REQUESTS = requestsRaw as RequestRow[];

const REGION: Record<string, string> = {
  Mumbai: "MH",
  "Mumbai Metro": "MH",
  Thane: "MH",
  Pune: "MH",
  Nashik: "MH",
  Nagpur: "MH",
  Bengaluru: "KA",
  Chennai: "TN",
  Hyderabad: "TS",
  Delhi: "DL",
  Ahmedabad: "GJ",
};

/** Deterministic 0..1 hash so "live" numbers stay stable per city+group+tick. */
function noise(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function daysSince(dateStr: string): number {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 999;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

const COOLDOWN_DAYS = 90;

function isEligible(donor: DonorRow): boolean {
  return (
    String(donor.status) === "active" &&
    daysSince(String(donor.last_donation_date)) >= COOLDOWN_DAYS &&
    Number(donor.fatigue_score) < 60
  );
}

function levelFor(shortage: number): RiskLevel {
  if (shortage >= 80) return "critical";
  if (shortage >= 55) return "high";
  if (shortage >= 30) return "moderate";
  return "stable";
}

/**
 * Builds a live city-level risk snapshot from the donor registry, hospital
 * inventory and the open-request queue. `tick` advances the simulated demand
 * curve so the dashboard reflects changing pressure over time.
 */
export function buildRiskSnapshot(tick = 0): RiskSnapshot {
  const cities = Object.keys(CITY_CENTERS);
  const phase = Math.sin(tick / 4);

  const result: CityRisk[] = cities.map((city) => {
    const cityDonors = DONORS.filter((d) => String(d.city) === city);
    const eligible = cityDonors.filter(isEligible);
    const cityHospitals = HOSPITALS.filter((h) => String(h.city) === city);
    const cityRequests = REQUESTS.filter(
      (r) => String(r.city) === city && String(r.status) !== "fulfilled",
    );
    const thalassemia = REQUESTS.filter(
      (r) => String(r.city) === city && String(r.patient_type) === "Thalassemia",
    ).length;

    const groups: GroupRisk[] = BLOOD_GROUPS.map((group) => {
      const supplyUnits = cityHospitals.reduce((s, h) => s + Number(h[group] ?? 0), 0);
      const groupEligible = eligible.filter((d) => String(d.blood_group) === group).length;

      const n = noise(`${city}|${group}`);
      const requestDemand = cityRequests
        .filter((r) => String(r.blood_group) === group)
        .reduce((s, r) => s + Number(r.units_needed ?? 1), 0);

      // Baseline clinical demand + thalassemia recurring load + live surge.
      const baseline = 2 + Math.round(n * 6);
      const surge = Math.round((0.5 + n) * 3 * (0.6 + phase * 0.4));
      const demandUnits = Math.max(1, baseline + requestDemand + Math.round(thalassemia * 0.6) + surge);

      const covered = supplyUnits + Math.min(groupEligible, Math.ceil(demandUnits * 0.8));
      const shortage = Math.max(
        0,
        Math.min(100, Math.round(((demandUnits - covered) / Math.max(1, demandUnits)) * 100 + 45 - covered * 1.5)),
      );

      return { group, supplyUnits, demandUnits, eligibleDonors: groupEligible, shortage };
    });

    const supplyUnits = groups.reduce((s, g) => s + g.supplyUnits, 0);
    const demandUnits = groups.reduce((s, g) => s + g.demandUnits, 0);
    const worst = groups.reduce((a, b) => (b.shortage > a.shortage ? b : a));
    const shortage = Math.round(
      groups.reduce((s, g) => s + g.shortage, 0) / groups.length * 0.55 + worst.shortage * 0.45,
    );

    const etaMinutes = Math.max(
      2,
      Math.round(3 + (100 - shortage) / 12 + noise(`${city}|eta|${tick}`) * 4),
    );

    return {
      city,
      region: REGION[city] ?? "IN",
      totalDonors: cityDonors.length,
      eligibleDonors: eligible.length,
      cooldownDonors: cityDonors.length - eligible.length,
      supplyUnits,
      demandUnits,
      shortage: Math.min(100, shortage),
      thalassemiaLoad: thalassemia,
      openRequests: cityRequests.length,
      criticalGroup: worst.group,
      groups,
      level: levelFor(shortage),
      etaMinutes,
      lat: CITY_CENTERS[city].lat,
      lng: CITY_CENTERS[city].lng,
    };
  });

  result.sort((a, b) => b.shortage - a.shortage);

  const mobilizableDonors = result.reduce((s, c) => s + c.eligibleDonors, 0);
  const supplyUnits = result.reduce((s, c) => s + c.supplyUnits, 0);
  const demandUnits = result.reduce((s, c) => s + c.demandUnits, 0);

  return {
    updatedAt: Date.now(),
    cities: result,
    totals: {
      citiesAtRisk: result.filter((c) => c.level === "critical" || c.level === "high").length,
      mobilizableDonors,
      supplyUnits,
      demandUnits,
      thalassemiaLoad: result.reduce((s, c) => s + c.thalassemiaLoad, 0),
      nationalShortage: Math.max(
        0,
        Math.round(((demandUnits - supplyUnits) / Math.max(1, demandUnits)) * 100),
      ),
    },
  };
}

export function formatEta(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  return `${h}h ${minutes % 60}m`;
}
