import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

const dispatchSchema = z.object({
  patientName: z.string().trim().min(2).max(80),
  bloodGroup: z.enum(GROUPS),
  unitsNeeded: z.number().int().min(1).max(20),
  city: z.string().trim().min(2).max(60),
  hospital: z.string().trim().max(120).default(""),
  contactPhone: z.string().trim().max(20).default(""),
  hospitalId: z.string().trim().max(120).default(""),
  hospitalContactPhone: z.string().trim().max(20).default(""),
  draftKey: z.string().uuid(),
  requesterChallengeId: z.string().uuid(),
  hospitalChallengeId: z.string().uuid(),
  poolSize: z.number().int().min(1).max(12).default(8),
});

export const dispatchEmergencyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => dispatchSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertVerifiedPhones } = await import("./phone-verification.server");
    await assertVerifiedPhones(
      context.supabase,
      context.userId,
      data.draftKey,
      data.requesterChallengeId,
      data.hospitalChallengeId,
    );
    const { dispatchEmergency } = await import("./emergency.server");
    return dispatchEmergency(context.supabase, context.userId, data);
  });

export const getEmergencyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: request, error } = await supabase
      .from("emergency_requests")
      .select(
        "id, patient_name, blood_group, units_needed, city, hospital, status, urgency, eta_minutes, notified_count, accepted_count, expires_at, resolution_note, created_at, updated_at",
      )
      .eq("id", data.requestId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!request) return null;

    const { data: notifications, error: nErr } = await supabase
      .from("emergency_notifications")
      .select(
        "id, donor_ref, donor_name, masked_phone, recipient_kind, status, error, response, responded_at, distance_km, eta_minutes, match_score, created_at",
      )
      .eq("request_id", data.requestId)
      .order("created_at", { ascending: true });
    if (nErr) throw new Error(nErr.message);

    return { request, notifications: notifications ?? [] };
  });

/** Lists the signed-in user's own emergency requests, newest first. */
export const listMyEmergencyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("emergency_requests")
      .select(
        "id, patient_name, blood_group, units_needed, city, hospital, status, eta_minutes, notified_count, accepted_count, expires_at, created_at",
      )
      .eq("created_by", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Closes an expired request and notifies everyone involved. Owner-scoped by RLS. */
export const expireEmergencyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { expireEmergency } = await import("./emergency.server");
    return expireEmergency(context.supabase, data.requestId);
  });
