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
  poolSize: z.number().int().min(1).max(12).default(8),
});

export const dispatchEmergencyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => dispatchSchema.parse(input))
  .handler(async ({ data, context }) => {
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
        "id, patient_name, blood_group, units_needed, city, hospital, status, eta_minutes, notified_count, accepted_count, created_at",
      )
      .eq("id", data.requestId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!request) return null;

    const { data: notifications, error: nErr } = await supabase
      .from("emergency_notifications")
      .select("donor_ref, donor_name, masked_phone, status, error, distance_km, eta_minutes, match_score")
      .eq("request_id", data.requestId)
      .order("created_at", { ascending: true });
    if (nErr) throw new Error(nErr.message);

    return { request, notifications: notifications ?? [] };
  });
