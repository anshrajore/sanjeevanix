import donorsRaw from "@/data/donors.json";

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
  outreachStatus: OutreachStatus;
};

export type MatchRequest = {
  bloodGroup: BloodGroup;
  city: string;
  language: DonorLanguage;
  minTrustScore: number;
  minAvailability: number;
  urgency: Urgency;
};

export type MatchResult = {
  requestId: string;
  matchedAt: string;
  donors: DonorMatch[];
  stats: {
    totalScanned: number;
    compatible: number;
    inCity: number;
    avgTrust: number;
    avgAvailability: number;
    avgDistance: number;
  };
};

/** Approximate inter-city distances (km) for nearest-donor ranking. */
const CITY_DISTANCE_KM: Record<string, Record<string, number>> = {
  Mumbai: {
    Mumbai: 0,
    "Mumbai Metro": 8,
    Thane: 24,
    Pune: 148,
    Nashik: 165,
    Nagpur: 820,
    Bengaluru: 980,
    Hyderabad: 710,
    Chennai: 1330,
    Delhi: 1400,
    Ahmedabad: 530,
  },
  "Mumbai Metro": {
    Mumbai: 8,
    "Mumbai Metro": 0,
    Thane: 18,
    Pune: 140,
    Nashik: 158,
    Nagpur: 812,
    Bengaluru: 972,
    Hyderabad: 702,
    Chennai: 1322,
    Delhi: 1392,
    Ahmedabad: 522,
  },
  Thane: {
    Mumbai: 24,
    "Mumbai Metro": 18,
    Thane: 0,
    Pune: 130,
    Nashik: 150,
    Nagpur: 800,
    Bengaluru: 960,
    Hyderabad: 690,
    Chennai: 1310,
    Delhi: 1380,
    Ahmedabad: 510,
  },
  Pune: {
    Pune: 0,
    Mumbai: 148,
    "Mumbai Metro": 140,
    Thane: 130,
    Nashik: 210,
    Nagpur: 680,
    Bengaluru: 840,
    Hyderabad: 560,
    Chennai: 1180,
    Delhi: 1480,
    Ahmedabad: 660,
  },
  Nashik: {
    Nashik: 0,
    Mumbai: 165,
    "Mumbai Metro": 158,
    Thane: 150,
    Pune: 210,
    Nagpur: 580,
    Bengaluru: 990,
    Hyderabad: 650,
    Chennai: 1250,
    Delhi: 1200,
    Ahmedabad: 450,
  },
  Bengaluru: {
    Bengaluru: 0,
    Chennai: 350,
    Hyderabad: 570,
    Mumbai: 980,
    Pune: 840,
    Nagpur: 1020,
    Delhi: 2150,
    Ahmedabad: 1490,
    Nashik: 990,
    Thane: 960,
    "Mumbai Metro": 972,
  },
  Chennai: {
    Chennai: 0,
    Bengaluru: 350,
    Hyderabad: 630,
    Mumbai: 1330,
    Pune: 1180,
    Nagpur: 1180,
    Delhi: 2200,
    Ahmedabad: 1750,
    Nashik: 1250,
    Thane: 1310,
    "Mumbai Metro": 1322,
  },
  Hyderabad: {
    Hyderabad: 0,
    Bengaluru: 570,
    Chennai: 630,
    Mumbai: 710,
    Pune: 560,
    Nagpur: 500,
    Delhi: 1570,
    Ahmedabad: 980,
    Nashik: 650,
    Thane: 690,
    "Mumbai Metro": 702,
  },
  Delhi: {
    Delhi: 0,
    Nagpur: 1020,
    Ahmedabad: 930,
    Mumbai: 1400,
    Pune: 1480,
    Nashik: 1200,
    Bengaluru: 2150,
    Hyderabad: 1570,
    Chennai: 2200,
    Thane: 1380,
    "Mumbai Metro": 1392,
  },
  Ahmedabad: {
    Ahmedabad: 0,
    Mumbai: 530,
    Pune: 660,
    Nashik: 450,
    Nagpur: 900,
    Delhi: 930,
    Bengaluru: 1490,
    Hyderabad: 980,
    Chennai: 1750,
    Thane: 510,
    "Mumbai Metro": 522,
  },
  Nagpur: {
    Nagpur: 0,
    Hyderabad: 500,
    Mumbai: 820,
    Pune: 680,
    Nashik: 580,
    Delhi: 1020,
    Ahmedabad: 900,
    Bengaluru: 1020,
    Chennai: 1180,
    Thane: 800,
    "Mumbai Metro": 812,
  },
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

const DONOR_DB: DonorRecord[] = (donorsRaw as Array<Record<string, string>>).map((row) => ({
  donor_id: row.donor_id,
  donor_name: row.donor_name,
  blood_group: row.blood_group as BloodGroup,
  city: row.city,
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
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

function cityDistanceKm(requestCity: string, donorCity: string, donorId: string): number {
  const base =
    CITY_DISTANCE_KM[requestCity]?.[donorCity] ?? CITY_DISTANCE_KM[donorCity]?.[requestCity] ?? 500;

  if (requestCity === donorCity) {
    const n = parseInt(donorId.replace(/\D/g, ""), 10) || 1;
    return Math.round((1 + (n % 12)) * 10) / 10;
  }

  return base;
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

export function runDonorMatch(request: MatchRequest, limit = 12): MatchResult {
  const compatibleGroups = COMPATIBILITY[request.bloodGroup];

  const pool = DONOR_DB.filter((d) => {
    if (d.status !== "active") return false;
    if (!compatibleGroups.includes(d.blood_group)) return false;
    if (d.trust_score < request.minTrustScore) return false;
    if (d.availability_score < request.minAvailability) return false;
    if (request.language !== "Any" && d.language !== request.language) return false;
    return true;
  });

  const ranked = pool
    .map((donor) => {
      const distanceKm = cityDistanceKm(request.city, donor.city, donor.donor_id);
      return {
        ...donor,
        distanceKm,
        matchScore: matchScore(donor, distanceKm, request),
        daysSinceDonation: daysSince(donor.last_donation_date),
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

  const inCity = ranked.filter((d) => d.city === request.city).length;
  const avgTrust =
    ranked.length > 0
      ? Math.round(ranked.reduce((s, d) => s + d.trust_score, 0) / ranked.length)
      : 0;
  const avgAvailability =
    ranked.length > 0
      ? Math.round(ranked.reduce((s, d) => s + d.availability_score, 0) / ranked.length)
      : 0;
  const avgDistance =
    ranked.length > 0
      ? Math.round((ranked.reduce((s, d) => s + d.distanceKm, 0) / ranked.length) * 10) / 10
      : 0;

  return {
    requestId: `MATCH-${Date.now().toString(36).toUpperCase()}`,
    matchedAt: new Date().toISOString(),
    donors: ranked,
    stats: {
      totalScanned: DONOR_DB.length,
      compatible: pool.length,
      inCity,
      avgTrust,
      avgAvailability,
      avgDistance,
    },
  };
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
