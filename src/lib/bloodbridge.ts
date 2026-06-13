import donorsRaw from "@/data/donors.json";
import requestsRaw from "@/data/requests.json";
import { getCityCenter } from "./geo";

export type Role = "donor" | "hospital" | "blood_bank" | "patient" | "admin";

export const ROLE_META: Record<Role, { label: string; accent: string; home: string }> = {
  admin: { label: "Super Admin", accent: "#FF4D6D", home: "/admin" },
  hospital: { label: "Hospital", accent: "#22D3EE", home: "/hospital-dashboard" },
  blood_bank: { label: "Blood Bank", accent: "#A78BFA", home: "/blood-bank" },
  donor: { label: "Donor", accent: "#34D399", home: "/donor-dashboard" },
  patient: { label: "Patient", accent: "#FBBF24", home: "/patient-dashboard" },
};

export type BBDonor = {
  donor_id: string;
  donor_name: string;
  blood_group: string;
  city: string;
  last_donation_date: string;
  trust_score: number;
  phone: string;
  language: string;
  status: string;
  availability_score: number;
  acceptance_prediction: number;
  response_rate: number;
  donation_reliability: number;
  fatigue_score: number;
  latitude: number;
  longitude: number;
  area?: string;
  pincode?: string;
};

export type BBRequest = {
  request_id: string;
  patient_name: string;
  blood_group: string;
  units_needed: number;
  city: string;
  hospital: string;
  urgency: number;
  status: string;
  patient_type: string;
  hospital_contact: string;
  patient_trust_score: number;
  required_before: string;
  assigned_donor_pool: string[];
  backup_donor_pool: string[];
  request_source: string;
};

export const DONORS: BBDonor[] = (donorsRaw as Array<Record<string, string | number>>).map(
  (d) => ({
    ...(d as object),
    trust_score: Number(d.trust_score),
    availability_score: Number(d.availability_score),
    acceptance_prediction: Number(d.acceptance_prediction),
    response_rate: Number(d.response_rate),
    donation_reliability: Number(d.donation_reliability),
    fatigue_score: Number(d.fatigue_score),
    latitude: Number(d.latitude),
    longitude: Number(d.longitude),
  }),
) as BBDonor[];

export const REQUESTS: BBRequest[] = requestsRaw as BBRequest[];

export const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export function cooldownStatus(d: BBDonor): {
  state: "available" | "cooldown" | "inactive";
  daysLeft: number;
  nextEligible: string;
} {
  if (d.status !== "active") return { state: "inactive", daysLeft: 0, nextEligible: "" };
  const days = daysSince(d.last_donation_date);
  const left = 90 - days;
  if (left > 0) {
    const next = new Date(new Date(d.last_donation_date).getTime() + 90 * 86400000);
    return {
      state: "cooldown",
      daysLeft: left,
      nextEligible: next.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    };
  }
  return { state: "available", daysLeft: 0, nextEligible: "Now" };
}

export function donorBadges(totalDonations: number) {
  const all = [
    { name: "First Drop", min: 1, emoji: "💧" },
    { name: "Lifesaver", min: 5, emoji: "🛟" },
    { name: "Hero", min: 10, emoji: "🦸" },
    { name: "Legend", min: 25, emoji: "👑" },
  ];
  return all.map((b) => ({ ...b, earned: totalDonations >= b.min }));
}

// Synthesize total donations from response rate + reliability so each donor has a story
export function synthDonations(d: BBDonor): number {
  return Math.max(1, Math.round((d.donation_reliability + d.response_rate) / 20));
}

export const URGENCY_LABEL: Record<number, { label: string; color: string }> = {
  5: { label: "CRITICAL", color: "#E63946" },
  4: { label: "URGENT", color: "#FF6B35" },
  3: { label: "HIGH", color: "#F59E0B" },
  2: { label: "ROUTINE", color: "#10B981" },
  1: { label: "SCHEDULED", color: "#6B7280" },
};

export function cityStats() {
  const cities = Array.from(new Set(DONORS.map((d) => d.city)));
  return cities.map((city) => {
    const donors = DONORS.filter((d) => d.city === city);
    const reqs = REQUESTS.filter((r) => r.city === city && r.status === "Open");
    const available = donors.filter((d) => cooldownStatus(d).state === "available").length;
    const pendingUnits = reqs.reduce((s, r) => s + r.units_needed, 0);
    const risk = available === 0 ? 99 : Math.round((pendingUnits / available) * 100) / 100;
    const center = getCityCenter(city);
    return {
      city,
      donorCount: donors.length,
      available,
      pending: reqs.length,
      pendingUnits,
      risk,
      lat: center.lat,
      lng: center.lng,
      byGroup: Object.fromEntries(
        BLOOD_GROUPS.map((g) => [g, donors.filter((d) => d.blood_group === g).length]),
      ),
    };
  });
}

export function riskColor(risk: number): string {
  if (risk >= 1.0) return "#E63946";
  if (risk >= 0.5) return "#F59E0B";
  return "#22C55E";
}

export function riskLabel(risk: number): string {
  if (risk >= 1.0) return "CRITICAL";
  if (risk >= 0.5) return "WATCH";
  return "SAFE";
}

// ---- Role state (localStorage + event) ----
const ROLE_KEY = "bb_role";
const VALID_ROLES: Role[] = ["admin", "hospital", "blood_bank", "donor", "patient"];
export function getRole(): Role {
  if (typeof window === "undefined") return "admin";
  const r = localStorage.getItem(ROLE_KEY) as Role;
  return VALID_ROLES.includes(r) ? r : "admin";
}
export function setRole(r: Role) {
  localStorage.setItem(ROLE_KEY, r);
  window.dispatchEvent(new Event("bb-role-change"));
}
