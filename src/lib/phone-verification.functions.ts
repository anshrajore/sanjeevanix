import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ phone: z.string().trim().min(10).max(20), purpose: z.enum(["requester", "hospital"]), draftKey: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { createPhoneChallenge } = await import("./phone-verification.server");
    return createPhoneChallenge(context.supabase, context.userId, data);
  });

export const confirmPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ challengeId: z.string().uuid(), draftKey: z.string().uuid(), otp: z.string().regex(/^\d{6}$/) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { verifyPhoneChallenge } = await import("./phone-verification.server");
    return verifyPhoneChallenge(context.supabase, context.userId, data);
  });