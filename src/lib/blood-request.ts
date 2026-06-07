import { z } from "zod";

import { getCityCenter } from "./geo";
import { savePatientRequest } from "./patient-requests";
import type { BloodGroup } from "./donor-matching";

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
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type BloodRequestInput = z.infer<typeof bloodRequestSchema>;

export async function submitBloodRequest(
  form: BloodRequestInput,
): Promise<{ ok: true; request_id: string } | { ok: false; error: string }> {
  const parsed = bloodRequestSchema.safeParse(form);
  if (!parsed.success) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  const center = getCityCenter(parsed.data.city);
  const saved = savePatientRequest({
    patient_name: parsed.data.patient_name,
    blood_group: parsed.data.blood_group as BloodGroup,
    units_needed: parsed.data.units_needed,
    city: parsed.data.city,
    hospital: parsed.data.hospital,
    urgency: parsed.data.urgency,
    patient_type: parsed.data.patient_type,
    hospital_contact: parsed.data.hospital_contact,
    required_before: parsed.data.required_before,
    latitude: parsed.data.latitude ?? center.lat,
    longitude: parsed.data.longitude ?? center.lng,
  });

  return { ok: true, request_id: saved.request_id };
}
