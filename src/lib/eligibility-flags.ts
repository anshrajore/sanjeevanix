import type { EligibilityAnswers } from "./eligibility";

export type RiskSeverity = "blocking" | "temporary" | "advisory";

export type RiskFlag = {
  code: string;
  label: string;
  severity: RiskSeverity;
  /** Plain-language explanation of why this affects donation. */
  explanation: string;
  /** What the donor can do about it. */
  action: string;
};

const NEVER_DONATED = 999;

/**
 * Explains every risk factor detected in a screening submission.
 * Pure + deterministic so it can be replayed over an audit record.
 */
export function riskFlags(a: EligibilityAnswers): RiskFlag[] {
  const flags: RiskFlag[] = [];

  const push = (f: RiskFlag) => flags.push(f);

  if (!a.consent) {
    push({
      code: "no_consent",
      label: "Consent not given",
      severity: "blocking",
      explanation: "We cannot screen or contact you without your explicit consent.",
      action: "Accept the consent statement to complete screening.",
    });
  }
  if (a.age > 0 && (a.age < 18 || a.age > 65)) {
    push({
      code: "age_out_of_range",
      label: `Age ${a.age} outside 18–65`,
      severity: a.age < 18 ? "temporary" : "blocking",
      explanation:
        "Indian blood-safety guidelines allow whole-blood donation only between 18 and 65 years.",
      action: a.age < 18 ? "You can register once you turn 18." : "Speak to a transfusion physician.",
    });
  }
  if (a.weight_kg > 0 && a.weight_kg < 50) {
    push({
      code: "low_weight",
      label: `Weight ${a.weight_kg} kg below 50 kg`,
      severity: "temporary",
      explanation:
        "Donors under 50 kg cannot safely give a 450 ml unit — the volume is too large a share of blood volume.",
      action: "Re-screen once you reach 50 kg.",
    });
  }
  if (a.hemoglobin !== null && a.hemoglobin < 12.5) {
    push({
      code: "low_hemoglobin",
      label: `Hemoglobin ${a.hemoglobin} g/dL below 12.5`,
      severity: "temporary",
      explanation: "Donating with low hemoglobin risks anaemia and dizziness for you.",
      action: "Iron-rich diet for 3–4 weeks, then re-test.",
    });
  } else if (a.hemoglobin !== null && a.hemoglobin < 13) {
    push({
      code: "borderline_hemoglobin",
      label: `Hemoglobin ${a.hemoglobin} g/dL is borderline`,
      severity: "advisory",
      explanation: "You clear the cut-off, but a low reserve makes post-donation fatigue likelier.",
      action: "Hydrate well and eat iron-rich food before your slot.",
    });
  }
  if (a.chronic_illness) {
    push({
      code: "chronic_illness",
      label: "Chronic illness history",
      severity: "blocking",
      explanation:
        "Heart, kidney, liver, cancer or uncontrolled diabetes history makes donation unsafe for the donor.",
      action: "Individual review by a transfusion physician is required.",
    });
  }
  if (a.on_blood_thinners) {
    push({
      code: "blood_thinners",
      label: "On blood-thinning medication",
      severity: "blocking",
      explanation: "Anticoagulants raise bleeding risk at the venepuncture site.",
      action: "Re-screen only after your physician stops the medication.",
    });
  }
  if (a.pregnant_or_nursing) {
    push({
      code: "pregnant_or_nursing",
      label: "Pregnant or nursing",
      severity: "temporary",
      explanation: "Iron demand is already elevated during pregnancy and lactation.",
      action: "Re-screen about 12 months after delivery or once nursing ends.",
    });
  }
  if (a.recent_surgery_or_transfusion) {
    push({
      code: "surgery_transfusion",
      label: "Surgery or transfusion in last 6 months",
      severity: "temporary",
      explanation:
        "A 6-month window covers the infection-marker testing gap after surgery or transfusion.",
      action: "Re-screen 6 months after the procedure.",
    });
  }
  if (a.recent_tattoo_or_piercing) {
    push({
      code: "tattoo_piercing",
      label: "Tattoo or piercing in last 6 months",
      severity: "temporary",
      explanation: "Skin-penetration procedures carry a transfusion-transmissible infection window.",
      action: "Re-screen 6 months after the procedure.",
    });
  }
  if (a.recent_infection_or_antibiotics) {
    push({
      code: "infection_antibiotics",
      label: "Recent infection or antibiotics",
      severity: "temporary",
      explanation: "An active infection can be transmitted through donated blood.",
      action: "Re-screen 14 days after finishing medication and being symptom-free.",
    });
  }
  if (a.last_donation_days !== NEVER_DONATED && a.last_donation_days < 90) {
    push({
      code: "cooldown",
      label: `${a.last_donation_days} days since last donation`,
      severity: "temporary",
      explanation: "A 90-day gap lets your iron stores and red cell count fully recover.",
      action: `Eligible again in ${90 - a.last_donation_days} days — we re-activate you automatically.`,
    });
  }
  if (a.alcohol_last_24h) {
    push({
      code: "alcohol_24h",
      label: "Alcohol in the last 24 hours",
      severity: "advisory",
      explanation: "Alcohol dehydrates you, which raises the chance of a fainting reaction.",
      action: "Skip alcohol for 24 hours before your appointment.",
    });
  }
  if (a.slept_less_than_5h) {
    push({
      code: "low_sleep",
      label: "Under 5 hours of sleep",
      severity: "advisory",
      explanation: "Sleep deprivation increases post-donation dizziness.",
      action: "Get at least 6 hours of sleep the night before.",
    });
  }

  return flags;
}

export const SEVERITY_STYLE: Record<RiskSeverity, string> = {
  blocking: "bg-[#E63946]/15 text-[#FF4D6D] border-[#E63946]/30",
  temporary: "bg-[#FFD166]/15 text-[#FFD166] border-[#FFD166]/30",
  advisory: "bg-white/5 text-white/60 border-white/10",
};

export const SEVERITY_LABEL: Record<RiskSeverity, string> = {
  blocking: "Blocking",
  temporary: "Temporary",
  advisory: "Advisory",
};
