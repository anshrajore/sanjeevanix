/** Donor eligibility screening rules (India / NBTC-aligned, simplified). */

export type EligibilityAnswers = {
  full_name: string;
  age: number;
  weight_kg: number;
  hemoglobin: number | null;
  blood_group: string;
  city: string;
  phone: string;
  last_donation_days: number;
  pregnant_or_nursing: boolean;
  chronic_illness: boolean;
  recent_tattoo_or_piercing: boolean;
  recent_infection_or_antibiotics: boolean;
  recent_surgery_or_transfusion: boolean;
  on_blood_thinners: boolean;
  alcohol_last_24h: boolean;
  slept_less_than_5h: boolean;
  consent: boolean;
};

export const EMPTY_ANSWERS: EligibilityAnswers = {
  full_name: "",
  age: 0,
  weight_kg: 0,
  hemoglobin: null,
  blood_group: "",
  city: "",
  phone: "",
  last_donation_days: 999,
  pregnant_or_nursing: false,
  chronic_illness: false,
  recent_tattoo_or_piercing: false,
  recent_infection_or_antibiotics: false,
  recent_surgery_or_transfusion: false,
  on_blood_thinners: false,
  alcohol_last_24h: false,
  slept_less_than_5h: false,
  consent: false,
};

export type EligibilityResult = {
  eligible: boolean;
  score: number;
  deferralReason: string | null;
  /** ISO date (yyyy-mm-dd) when the donor may be eligible again. */
  nextEligibleDate: string | null;
  advisories: string[];
};

function inDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function evaluateEligibility(a: EligibilityAnswers): EligibilityResult {
  const advisories: string[] = [];
  let score = 100;

  // Permanent / long deferrals first.
  if (!a.consent) {
    return {
      eligible: false,
      score: 0,
      deferralReason: "Consent is required before we can screen you.",
      nextEligibleDate: null,
      advisories,
    };
  }
  if (a.age < 18 || a.age > 65) {
    return {
      eligible: false,
      score: 0,
      deferralReason: "Donors must be between 18 and 65 years old.",
      nextEligibleDate: a.age < 18 ? inDays((18 - a.age) * 365) : null,
      advisories,
    };
  }
  if (a.weight_kg < 50) {
    return {
      eligible: false,
      score: 20,
      deferralReason: "A minimum body weight of 50 kg is required for whole-blood donation.",
      nextEligibleDate: null,
      advisories: ["Rescreen once you reach 50 kg."],
    };
  }
  if (a.hemoglobin !== null && a.hemoglobin < 12.5) {
    return {
      eligible: false,
      score: 35,
      deferralReason: `Hemoglobin ${a.hemoglobin} g/dL is below the 12.5 g/dL cut-off.`,
      nextEligibleDate: inDays(30),
      advisories: ["Iron-rich diet recommended; recheck in about a month."],
    };
  }
  if (a.chronic_illness) {
    return {
      eligible: false,
      score: 30,
      deferralReason: "Active heart, kidney, liver, cancer or uncontrolled diabetes history.",
      nextEligibleDate: null,
      advisories: ["A transfusion physician can review your case individually."],
    };
  }
  if (a.on_blood_thinners) {
    return {
      eligible: false,
      score: 30,
      deferralReason: "Blood-thinning medication makes donation unsafe.",
      nextEligibleDate: null,
      advisories: [],
    };
  }
  if (a.pregnant_or_nursing) {
    return {
      eligible: false,
      score: 40,
      deferralReason: "Pregnant or nursing donors are deferred for safety.",
      nextEligibleDate: inDays(365),
      advisories: [],
    };
  }
  if (a.recent_surgery_or_transfusion) {
    return {
      eligible: false,
      score: 45,
      deferralReason: "Surgery or a transfusion in the last 6 months.",
      nextEligibleDate: inDays(180),
      advisories: [],
    };
  }
  if (a.recent_tattoo_or_piercing) {
    return {
      eligible: false,
      score: 50,
      deferralReason: "Tattoo or piercing in the last 6 months.",
      nextEligibleDate: inDays(180),
      advisories: [],
    };
  }
  if (a.recent_infection_or_antibiotics) {
    return {
      eligible: false,
      score: 55,
      deferralReason: "Recent infection or antibiotic course.",
      nextEligibleDate: inDays(14),
      advisories: ["Rescreen 14 days after finishing your medication."],
    };
  }
  if (a.last_donation_days < 90) {
    return {
      eligible: false,
      score: 65,
      deferralReason: `Only ${a.last_donation_days} days since your last donation — 90 days are required.`,
      nextEligibleDate: inDays(90 - a.last_donation_days),
      advisories: ["You'll be re-activated in the donor pool automatically."],
    };
  }

  // Soft factors — eligible, but advise.
  if (a.alcohol_last_24h) {
    score -= 25;
    advisories.push("Avoid alcohol for 24 hours before donating.");
  }
  if (a.slept_less_than_5h) {
    score -= 15;
    advisories.push("Aim for at least 6 hours of sleep before your appointment.");
  }
  if (a.hemoglobin !== null && a.hemoglobin < 13) {
    score -= 10;
    advisories.push("Hemoglobin is on the lower side — hydrate and eat iron-rich food.");
  }
  if (a.last_donation_days < 120) score -= 5;
  advisories.push("Drink 500 ml of water and eat a light meal 1–2 hours before donating.");

  return {
    eligible: true,
    score: Math.max(40, Math.min(100, score)),
    deferralReason: null,
    nextEligibleDate: null,
    advisories,
  };
}
