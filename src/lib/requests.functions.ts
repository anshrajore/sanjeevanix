import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const submitStandardBloodRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      patientName: z.string().trim().min(2).max(80),
      bloodGroup: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
      unitsNeeded: z.number().int().min(1).max(20),
      city: z.string().trim().min(2).max(60),
      hospital: z.string().trim().min(2).max(120),
      hospitalContactPhone: z.string().trim().max(20),
      urgency: z.string().trim().max(30),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: request, error } = await context.supabase
      .from("emergency_requests")
      .insert({
        created_by: context.userId,
        patient_name: data.patientName,
        blood_group: data.bloodGroup,
        units_needed: data.unitsNeeded,
        city: data.city,
        hospital: data.hospital,
        hospital_contact_phone: data.hospitalContactPhone || null,
        contact_phone: data.hospitalContactPhone || null,
        urgency: data.urgency,
        status: "dispatching",
        request_source: "standard",
      })
      .select("id")
      .single();
    if (error || !request) throw new Error(error?.message ?? "Could not create request.");
    return { ok: true as const, requestId: request.id };
  });