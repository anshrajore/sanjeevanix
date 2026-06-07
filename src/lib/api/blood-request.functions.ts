import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAppsScriptUrl } from "../config.server";

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

export const submitBloodRequest = createServerFn({ method: "POST" })
  .inputValidator(bloodRequestSchema)
  .handler(async ({ data }) => {
    const url = getAppsScriptUrl();
    if (!url) {
      return {
        ok: false as const,
        error: "Blood intake is not configured. Set APPS_SCRIPT_URL in your environment.",
      };
    }

    const request_id = `SJX-${Date.now().toString(36).toUpperCase()}`;
    const payload = { request_id, ...data };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await res.text();
    let parsed: { ok?: boolean; error?: string; request_id?: string };
    try {
      parsed = JSON.parse(text) as typeof parsed;
    } catch {
      return { ok: false as const, error: "Unexpected response from Google Sheets intake." };
    }

    if (!res.ok || parsed.ok === false) {
      return { ok: false as const, error: parsed.error ?? "Submission failed. Try again." };
    }

    return { ok: true as const, request_id: parsed.request_id ?? request_id };
  });
