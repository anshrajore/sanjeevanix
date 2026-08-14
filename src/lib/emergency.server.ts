import type { SupabaseClient } from "@supabase/supabase-js";

import {
  runDonorMatch,
  defaultMatchOrigin,
  type BloodGroup,
  type Urgency,
} from "./donor-matching";
import { DONORS } from "./bloodbridge";
import {
  maskPhoneNumber,
  notifyDonorLifecycle,
  notifyRequester,
  sendMessage,
  toE164,
} from "./emergency-notify.server";

export type EmergencyInput = {
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  city: string;
  hospital: string;
  contactPhone: string;
  poolSize: number;
};

export const maskPhone = maskPhoneNumber;

const REQUEST_FIELDS =
  "id, patient_name, blood_group, units_needed, city, hospital, contact_phone, eta_minutes, status, expires_at, accepted_count, notified_count";

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

function donorPhone(donorRef: string): string | null {
  return DONORS.find((d) => d.donor_id === donorRef)?.phone ?? null;
}

/**
 * Creates the emergency request, ranks the highest-priority compatible donor
 * pool, alerts each donor over WhatsApp and confirms dispatch to the requester.
 * Never throws on a per-recipient failure — outcomes are recorded instead.
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
    .select(REQUEST_FIELDS)
    .single();

  if (reqError || !request) {
    throw new Error(`Could not create the emergency request: ${reqError?.message ?? "unknown"}`);
  }

  const outcomes = await Promise.all(
    match.donors.map(async (donor) => {
      const send = await sendMessage(
        toE164(donor.phone),
        buildMessage(input, donor.donor_name, donor.etaMinutes),
        "whatsapp",
      );
      return {
        request_id: request.id,
        donor_ref: donor.donor_id,
        donor_name: donor.donor_name,
        masked_phone: maskPhoneNumber(donor.phone),
        channel: "whatsapp",
        recipient_kind: "donor",
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
  const status =
    match.donors.length === 0 ? "no_donors" : notified > 0 ? "notified" : "delivery_failed";

  await supabase
    .from("emergency_requests")
    .update({ notified_count: notified, status })
    .eq("id", request.id);

  await notifyRequester(supabase, request, "dispatched", { notified, etaMinutes });

  return {
    requestId: request.id as string,
    status,
    notified,
    poolSize: outcomes.length,
    etaMinutes,
    expiresAt: request.expires_at as string,
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

/**
 * Records a donor's accept/decline for one alert. On the first acceptance the
 * request flips to `accepted` and both the donor and requester are messaged.
 */
export async function recordDonorResponse(
  supabase: SupabaseClient,
  notificationId: string,
  response: "accepted" | "declined",
) {
  const { data: note, error } = await supabase
    .from("emergency_notifications")
    .update({ response, responded_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select("id, request_id, donor_ref, donor_name, eta_minutes")
    .single();
  if (error || !note) throw new Error(error?.message ?? "Alert not found.");

  const { data: request } = await supabase
    .from("emergency_requests")
    .select(REQUEST_FIELDS)
    .eq("id", note.request_id)
    .single();
  if (!request) throw new Error("Emergency request not found.");

  if (response === "declined") {
    return { requestId: request.id, status: request.status, donorName: note.donor_name };
  }

  const accepted = (request.accepted_count ?? 0) + 1;
  await supabase
    .from("emergency_requests")
    .update({
      accepted_count: accepted,
      status: "accepted",
      eta_minutes: note.eta_minutes ?? request.eta_minutes,
    })
    .eq("id", request.id);

  await notifyDonorLifecycle(donorPhone(note.donor_ref), request.blood_group, "accepted");
  await notifyRequester(supabase, request, "accepted", {
    donorName: note.donor_name,
    etaMinutes: note.eta_minutes ?? request.eta_minutes,
  });

  return { requestId: request.id, status: "accepted", donorName: note.donor_name };
}

/**
 * Closes a request whose response window has elapsed with no acceptance, and
 * tells the requester plus every stand-by donor.
 */
export async function expireEmergency(supabase: SupabaseClient, requestId: string) {
  const { data: request } = await supabase
    .from("emergency_requests")
    .select(REQUEST_FIELDS)
    .eq("id", requestId)
    .single();
  if (!request) throw new Error("Emergency request not found.");

  const open = request.status === "dispatching" || request.status === "notified";
  const due = new Date(request.expires_at).getTime() <= Date.now();
  if (!open || !due) return { requestId, status: request.status, expired: false };

  await supabase.from("emergency_requests").update({ status: "timed_out" }).eq("id", requestId);

  const { data: alerts } = await supabase
    .from("emergency_notifications")
    .select("donor_ref, response, recipient_kind")
    .eq("request_id", requestId)
    .eq("recipient_kind", "donor");

  await Promise.all(
    (alerts ?? [])
      .filter((a) => !a.response)
      .map((a) => notifyDonorLifecycle(donorPhone(a.donor_ref), request.blood_group, "timeout")),
  );
  await notifyRequester(supabase, request, "timeout");

  return { requestId, status: "timed_out", expired: true };
}
