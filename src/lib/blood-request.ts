import { z } from "zod";

export const bloodRequestSchema = z.object({
  patient_name: z.string().min(1),
  blood_group: z.string(),
  units_needed: z.string(),
  city: z.string().min(1),
  hospital: z.string().min(1),
  urgency: z.string(),
  status: z.string(),
  patient_type: z.string(),
  hospital_contact: z.string().min(1),
  patient_trust_score: z.string(),
  required_before: z.string().min(1),
  assigned_donor_pool: z.string(),
  backup_donor_pool: z.string(),
  request_source: z.string(),
});

export type BloodRequestInput = z.infer<typeof bloodRequestSchema>;

export async function submitBloodRequest(
  form: BloodRequestInput,
): Promise<{ ok: true; request_id: string } | { ok: false; error: string }> {
  const parsed = bloodRequestSchema.safeParse(form);
  if (!parsed.success) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  const request_id = `SJX-${Date.now().toString(36).toUpperCase()}`;
  return { ok: true, request_id };
}
