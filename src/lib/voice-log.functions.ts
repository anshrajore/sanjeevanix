import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const payload = z.object({
  assistantId: z.string().trim().max(120).default(""),
  outcome: z.string().trim().max(30).default("unknown"),
  startedAt: z.string().trim().max(40),
  endedAt: z.string().trim().max(40).default(""),
  durationSeconds: z.number().int().min(0).max(86400).default(0),
  errorMessage: z.string().trim().max(2000).default(""),
  fallbackReason: z.string().trim().max(2000).default(""),
  transcript: z
    .array(z.object({ at: z.number(), role: z.string().max(30), text: z.string().max(2000) }))
    .default([]),
  metadata: z.record(z.unknown()).default({}),
});

/** Records one Talk-to-AI call attempt (transcript + diagnostics) for admin audit. */
export const logVoiceCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => payload.parse(input ?? {}))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { logged: false };

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { error } = await supabase.from("voice_call_logs").insert({
      assistant_id: data.assistantId || null,
      outcome: data.outcome,
      started_at: data.startedAt,
      ended_at: data.endedAt || null,
      duration_seconds: data.durationSeconds,
      error_message: data.errorMessage || null,
      fallback_reason: data.fallbackReason || null,
      transcript: data.transcript,
      metadata: data.metadata,
    });
    if (error) return { logged: false, error: error.message };
    return { logged: true };
  });
