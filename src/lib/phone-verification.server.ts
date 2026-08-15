import { createHash, randomInt, randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { maskPhoneNumber, sendMessage, toE164 } from "./emergency-notify.server";

const OTP_TTL_MINUTES = 10;
const RESEND_SECONDS = 60;

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function createPhoneChallenge(
  supabase: SupabaseClient,
  userId: string,
  input: { phone: string; purpose: "requester" | "hospital"; draftKey?: string },
) {
  const phone = toE164(input.phone);
  if (!/^\+[1-9]\d{9,14}$/.test(phone)) throw new Error("Enter a valid phone number with country code.");

  const { data: recent } = await supabase
    .from("phone_verification_challenges")
    .select("resend_available_at")
    .eq("user_id", userId)
    .eq("purpose", input.purpose)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent && new Date(recent.resend_available_at).getTime() > Date.now()) {
    throw new Error("Please wait before requesting another code.");
  }

  const otp = String(randomInt(100000, 1000000));
  const draftKey = input.draftKey ?? randomUUID();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();
  const resendAt = new Date(Date.now() + RESEND_SECONDS * 1000).toISOString();
  const outcome = await sendMessage(
    phone,
    `Your Sanjeevani X verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes. Do not share it.`,
    "sms",
  );
  if (outcome.status !== "sent") throw new Error(outcome.error ?? "Could not send the verification code.");

  const { data, error } = await supabase
    .from("phone_verification_challenges")
    .insert({
      user_id: userId,
      purpose: input.purpose,
      phone_hash: digest(phone),
      masked_phone: maskPhoneNumber(phone),
      otp_hash: digest(`${otp}:${userId}:${draftKey}`),
      draft_key: draftKey,
      expires_at: expiresAt,
      resend_available_at: resendAt,
    })
    .select("id, draft_key, masked_phone, expires_at, resend_available_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create verification challenge.");
  return data;
}

export async function verifyPhoneChallenge(
  supabase: SupabaseClient,
  userId: string,
  input: { challengeId: string; draftKey: string; otp: string },
) {
  const { data, error } = await supabase
    .from("phone_verification_challenges")
    .select("id, otp_hash, attempts, max_attempts, expires_at, verified_at, consumed_at")
    .eq("id", input.challengeId)
    .eq("user_id", userId)
    .eq("draft_key", input.draftKey)
    .single();
  if (error || !data) throw new Error("Verification challenge not found.");
  if (data.consumed_at) throw new Error("This verification code was already used.");
  if (data.verified_at) return { verified: true };
  if (new Date(data.expires_at).getTime() <= Date.now()) throw new Error("This code has expired.");
  if (data.attempts >= data.max_attempts) throw new Error("Too many incorrect attempts. Request a new code.");

  const valid = digest(`${input.otp}:${userId}:${input.draftKey}`) === data.otp_hash;
  const { error: updateError } = await supabase
    .from("phone_verification_challenges")
    .update({ attempts: data.attempts + 1, verified_at: valid ? new Date().toISOString() : null })
    .eq("id", data.id);
  if (updateError) throw new Error(updateError.message);
  if (!valid) throw new Error("Incorrect verification code.");
  return { verified: true };
}

export async function assertVerifiedPhones(
  supabase: SupabaseClient,
  userId: string,
  draftKey: string,
  requesterChallengeId: string,
  hospitalChallengeId: string,
) {
  const { data, error } = await supabase
    .from("phone_verification_challenges")
    .select("id, purpose, verified_at, consumed_at, expires_at")
    .eq("user_id", userId)
    .eq("draft_key", draftKey)
    .in("id", [requesterChallengeId, hospitalChallengeId]);
  if (error) throw new Error(error.message);
  const valid = (data ?? []).filter(
    (row) => row.verified_at && !row.consumed_at && new Date(row.expires_at).getTime() > Date.now(),
  );
  if (!valid.some((row) => row.purpose === "requester") || !valid.some((row) => row.purpose === "hospital")) {
    throw new Error("Verify both requester and hospital phone numbers before dispatch.");
  }
  await supabase
    .from("phone_verification_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .in("id", [requesterChallengeId, hospitalChallengeId]);
}