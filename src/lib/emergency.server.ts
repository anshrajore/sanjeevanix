import type { SupabaseClient } from "@supabase/supabase-js";

import {
  runDonorMatch,
  defaultMatchOrigin,
  type BloodGroup,
  type Urgency,
} from "./donor-matching";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export type EmergencyInput = {
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  city: string;
  hospital: string;
  contactPhone: string;
  poolSize: number;
};

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "•••";
  return `${digits.slice(0, 4)}••••${digits.slice(-2)}`;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

function buildMessage(input: EmergencyInput, donorName: string, etaMinutes: number): string {
  return [
    `🚨 SANJEEVANI X — EMERGENCY BLOOD REQUEST`,
    ``,
    `Hi ${donorName}, a patient near you needs blood urgently.`,
    `Blood group: ${input.bloodGroup} · Units: ${input.unitsNeeded}`,
    `Hospital: ${input.hospital || input.city}`,
    `City: ${input.city}`,
    `Estimated travel time: ~${etaMinutes} min`,
    ``,
    `Reply YES to accept — our AI coordinator will call you and book your slot.`,
    `Reply NO if you can't make it. Thank you for being a Blood Warrior. ❤️`,
  ].join("\n");
}

type SendOutcome = { status: string; sid: string | null; error: string | null };

async function sendWhatsApp(to: string, body: string): Promise<SendOutcome> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  const from = process.env["TWILIO_WHATSAPP_FROM"] ?? "whatsapp:+14155238886";

  if (!lovableKey || !twilioKey) {
    return { status: "skipped", sid: null, error: "Messaging is not configured." };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `whatsapp:${to}`,
        From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
        Body: body,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
      code?: number;
    };

    if (!res.ok) {
      return {
        status: "failed",
        sid: null,
        error: payload.message ?? `Provider returned ${res.status}`,
      };
    }
    return { status: "sent", sid: payload.sid ?? null, error: null };
  } catch (e) {
    return {
      status: "failed",
      sid: null,
      error: e instanceof Error ? e.message : "Network error while notifying donor.",
    };
  }
}

/**
 * Creates the emergency request, ranks the highest-priority compatible donor
 * pool and notifies each donor over WhatsApp. Never throws on a per-donor
 * failure — the outcome is recorded so the UI can show real status.
 */
export async function dispatchEmergency(
  supabase: SupabaseClient,
  userId: string,
  input: EmergencyInput,
) {
  const match = runDonorMatch(
    {
      bloodGroup: input.bloodGroup,
      city: input.city,
      language: "Any",
      minTrustScore: 55,
      minAvailability: 50,
      maxFatigue: 70,
      minDaysSinceDonation: 90,
      maxRadiusKm: 50,
      autoExpandRadius: true,
      urgency: "Critical" as Urgency,
      origin: defaultMatchOrigin(input.city),
    },
    input.poolSize,
  );

  const etaMinutes = match.donors.length > 0 ? match.donors[0].etaMinutes : null;

  const { data: request, error: reqError } = await supabase
    .from("emergency_requests")
    .insert({
      created_by: userId,
      patient_name: input.patientName,
      blood_group: input.bloodGroup,
      units_needed: input.unitsNeeded,
      city: input.city,
      hospital: input.hospital || null,
      contact_phone: input.contactPhone || null,
      urgency: "Critical",
      status: match.donors.length > 0 ? "dispatching" : "no_donors",
      eta_minutes: etaMinutes,
    })
    .select("id, status, created_at")
    .single();

  if (reqError || !request) {
    throw new Error(`Could not create the emergency request: ${reqError?.message ?? "unknown"}`);
  }

  const outcomes = await Promise.all(
    match.donors.map(async (donor) => {
      const send = await sendWhatsApp(
        toE164(donor.phone),
        buildMessage(input, donor.donor_name, donor.etaMinutes),
      );
      return {
        request_id: request.id,
        donor_ref: donor.donor_id,
        donor_name: donor.donor_name,
        masked_phone: maskPhone(donor.phone),
        channel: "whatsapp",
        status: send.status,
        provider_sid: send.sid,
        error: send.error,
        distance_km: donor.distanceKm,
        eta_minutes: donor.etaMinutes,
        match_score: donor.matchScore,
      };
    }),
  );

  if (outcomes.length > 0) {
    const { error: logError } = await supabase.from("emergency_notifications").insert(outcomes);
    if (logError) console.error("emergency_notifications insert failed", logError.message);
  }

  const notified = outcomes.filter((o) => o.status === "sent").length;
  const status = match.donors.length === 0 ? "no_donors" : notified > 0 ? "notified" : "delivery_failed";

  await supabase
    .from("emergency_requests")
    .update({ notified_count: notified, status })
    .eq("id", request.id);

  return {
    requestId: request.id as string,
    status,
    notified,
    poolSize: outcomes.length,
    etaMinutes,
    radiusUsedKm: match.radiusUsedKm,
    expanded: match.expanded,
    donors: outcomes.map((o) => ({
      donorRef: o.donor_ref,
      name: o.donor_name,
      maskedPhone: o.masked_phone,
      status: o.status,
      error: o.error,
      distanceKm: o.distance_km,
      etaMinutes: o.eta_minutes,
      matchScore: o.match_score,
    })),
  };
}
