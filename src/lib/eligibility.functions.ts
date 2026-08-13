import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const answersSchema = z.object({
  full_name: z.string().trim().max(120),
  age: z.number().int().min(0).max(120),
  weight_kg: z.number().min(0).max(400),
  hemoglobin: z.number().min(0).max(30).nullable(),
  blood_group: z.string().trim().max(4),
  city: z.string().trim().max(80),
  phone: z.string().trim().max(20),
  last_donation_days: z.number().int().min(0).max(20000),
  pregnant_or_nursing: z.boolean(),
  chronic_illness: z.boolean(),
  recent_tattoo_or_piercing: z.boolean(),
  recent_infection_or_antibiotics: z.boolean(),
  recent_surgery_or_transfusion: z.boolean(),
  on_blood_thinners: z.boolean(),
  alcohol_last_24h: z.boolean(),
  slept_less_than_5h: z.boolean(),
  consent: z.boolean(),
});

const saveSchema = z.object({
  answers: answersSchema,
  eligible: z.boolean(),
  score: z.number().int().min(0).max(100),
  deferralReason: z.string().max(300).nullable(),
  nextEligibleDate: z.string().max(20).nullable(),
});

export const saveEligibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("donor_eligibility")
      .insert({
        user_id: userId,
        answers: data.answers,
        eligible: data.eligible,
        score: data.score,
        deferral_reason: data.deferralReason,
        next_eligible_date: data.nextEligibleDate,
      })
      .select("id, eligible, score, deferral_reason, next_eligible_date, created_at")
      .single();

    if (error) throw new Error(`Could not save your screening: ${error.message}`);

    await supabase
      .from("profiles")
      .update({
        full_name: data.answers.full_name || null,
        phone: data.answers.phone || null,
        city: data.answers.city || null,
        blood_group: data.answers.blood_group || null,
      })
      .eq("id", userId);

    return row;
  });

export const getLatestEligibility = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("donor_eligibility")
      .select("id, answers, eligible, score, deferral_reason, next_eligible_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  });
