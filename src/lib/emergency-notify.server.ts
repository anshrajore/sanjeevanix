import type { SupabaseClient } from "@supabase/supabase-js";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export type SendOutcome = { status: string; sid: string | null; error: string | null };

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "•••";
  return `${digits.slice(0, 4)}••••${digits.slice(-2)}`;
}

export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

/**
 * Sends a message through the Twilio connector gateway.
 * `channel: "whatsapp"` prefixes both numbers; `"sms"` sends a plain SMS.
 */
export async function sendMessage(
  to: string,
  body: string,
  channel: "whatsapp" | "sms" = "whatsapp",
): Promise<SendOutcome> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  const waFrom = process.env["TWILIO_WHATSAPP_FROM"] ?? "whatsapp:+14155238886";
  const smsFrom = process.env["TWILIO_SMS_FROM"] ?? "";

  if (!lovableKey || !twilioKey) {
    return { status: "skipped", sid: null, error: "Messaging is not configured." };
  }
  if (channel === "sms" && !smsFrom) {
    return {
      status: "skipped",
      sid: null,
      error: "No SMS sender number configured — set TWILIO_SMS_FROM.",
    };
  }

  const from =
    channel === "whatsapp"
      ? waFrom.startsWith("whatsapp:")
        ? waFrom
        : `whatsapp:${waFrom}`
      : smsFrom;
  const target = channel === "whatsapp" ? `whatsapp:${to}` : to;

  try {
    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: target, From: from, Body: body }),
    });

    const payload = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
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
      error: e instanceof Error ? e.message : "Network error while sending the message.",
    };
  }
}

type RequesterEvent = "dispatched" | "accepted" | "timeout";

type RequestSummary = {
  id: string;
  patient_name: string;
  blood_group: string;
  units_needed: number;
  city: string;
  hospital: string | null;
  contact_phone: string | null;
  eta_minutes: number | null;
};

function requesterBody(
  event: RequesterEvent,
  r: RequestSummary,
  extra: { notified?: number; donorName?: string; etaMinutes?: number | null },
): string {
  const eta = extra.etaMinutes ?? r.eta_minutes;
  const etaText = eta ? `~${eta} min` : "being calculated";
  const head = `SANJEEVANI X · ${r.blood_group} × ${r.units_needed}u · ${r.hospital || r.city}`;

  if (event === "dispatched") {
    return [
      `🚨 ${head}`,
      `Emergency request for ${r.patient_name} is live.`,
      `${extra.notified ?? 0} matched donors alerted. Nearest donor ETA ${etaText}.`,
      `We'll message you the moment a donor accepts.`,
    ].join("\n");
  }
  if (event === "accepted") {
    return [
      `✅ ${head}`,
      `${extra.donorName ?? "A donor"} ACCEPTED for ${r.patient_name}.`,
      `Estimated arrival ${etaText}. Our coordinator is confirming the slot now.`,
    ].join("\n");
  }
  return [
    `⏳ ${head}`,
    `No donor confirmed in the response window for ${r.patient_name}.`,
    `Escalating to blood banks and widening the search radius. Reply or re-dispatch to alert a larger pool.`,
  ].join("\n");
}

/**
 * Messages the requester about a dispatch lifecycle event and logs the receipt
 * alongside the donor notifications. Never throws.
 */
export async function notifyRequester(
  supabase: SupabaseClient,
  request: RequestSummary,
  event: RequesterEvent,
  extra: { notified?: number; donorName?: string; etaMinutes?: number | null } = {},
): Promise<SendOutcome> {
  if (!request.contact_phone) {
    return { status: "skipped", sid: null, error: "No requester contact number on file." };
  }

  const body = requesterBody(event, request, extra);
  const outcome = await sendMessage(toE164(request.contact_phone), body, "whatsapp");

  const { error } = await supabase.from("emergency_notifications").insert({
    request_id: request.id,
    donor_ref: `requester:${event}`,
    donor_name: "Requester update",
    masked_phone: maskPhoneNumber(request.contact_phone),
    channel: "whatsapp",
    recipient_kind: "requester",
    status: outcome.status,
    provider_sid: outcome.sid,
    error: outcome.error,
    eta_minutes: extra.etaMinutes ?? request.eta_minutes,
  });
  if (error) console.error("requester notification log failed", error.message);

  return outcome;
}

const DONOR_UPDATE: Record<"accepted" | "timeout", (group: string) => string> = {
  accepted: (group) =>
    `SANJEEVANI X: Thank you! Your ${group} donation slot is confirmed. Our coordinator will call with the exact ward and time. Please hydrate and eat before arriving. ❤️`,
  timeout: (group) =>
    `SANJEEVANI X: The ${group} emergency request you were alerted about has closed. No action needed — thank you for standing by. ❤️`,
};

export async function notifyDonorLifecycle(
  phone: string | null,
  bloodGroup: string,
  event: "accepted" | "timeout",
): Promise<SendOutcome> {
  if (!phone) return { status: "skipped", sid: null, error: "No donor number available." };
  return sendMessage(toE164(phone), DONOR_UPDATE[event](bloodGroup), "whatsapp");
}
