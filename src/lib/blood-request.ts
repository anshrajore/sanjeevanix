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

function getAppsScriptUrl(): string | undefined {
  return import.meta.env.VITE_APPS_SCRIPT_URL?.trim() || undefined;
}

export async function submitBloodRequest(
  form: BloodRequestInput,
): Promise<{ ok: true; request_id: string } | { ok: false; error: string }> {
  const url = getAppsScriptUrl();
  if (!url) {
    return {
      ok: false,
      error: "Blood intake is not configured. Set VITE_APPS_SCRIPT_URL in your environment.",
    };
  }

  const request_id = `SJX-${Date.now().toString(36).toUpperCase()}`;
  const payload = { request_id, ...form };

  // text/plain avoids CORS preflight against Apps Script
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let parsed: { ok?: boolean; error?: string; request_id?: string };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    if (text.includes("Script function not found")) {
      return {
        ok: false,
        error:
          "Google Apps Script is not deployed. Deploy google-apps-script/blood-intake.gs as a web app.",
      };
    }
    return { ok: false, error: "Unexpected response from Google Sheets intake." };
  }

  if (!res.ok || parsed.ok === false) {
    return { ok: false, error: parsed.error ?? "Submission failed. Try again." };
  }

  return { ok: true, request_id: parsed.request_id ?? request_id };
}
