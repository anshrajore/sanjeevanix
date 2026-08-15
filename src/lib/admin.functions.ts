import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["admin", "coordinator", "user"] as const;

/** Verifies the caller is an admin (through their own RLS-scoped client). */
async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data, error } = await (context.supabase as never as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  }).rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — admin access required.");
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** What the signed-in user is allowed to see in the console. */
export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const list = (roles ?? []).map((r) => r.role as string);
    return { userId, roles: list, isAdmin: list.includes("admin") };
  });

/**
 * First-run bootstrap: if the platform has no admin yet, the signed-in user
 * claims the role. Once an admin exists this always refuses.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await adminClient();
    const { count, error } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) throw new Error("An administrator already exists for this platform.");

    const { error: insertError } = await admin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertError) throw new Error(insertError.message);
    return { granted: true };
  });

export const adminListRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.string().trim().max(30).default("all"),
        city: z.string().trim().max(60).default("all"),
        bloodGroup: z.string().trim().max(3).default("all"),
        source: z.string().trim().max(30).default("all"),
        riskFlag: z.string().trim().max(60).default("all"),
        from: z.string().trim().max(40).default(""),
        to: z.string().trim().max(40).default(""),
        search: z.string().trim().max(80).default(""),
        limit: z.number().int().min(1).max(200).default(60),
        offset: z.number().int().min(0).default(0),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { adminRequests } = await import("./admin.server");
    return adminRequests(await adminClient(), data);
  });

export const adminGetRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { adminRequestDetail } = await import("./admin.server");
    return adminRequestDetail(await adminClient(), data.requestId);
  });

export const adminGetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminOverview } = await import("./admin.server");
    return adminOverview(await adminClient());
  });

export const adminListScreenings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { adminScreenings } = await import("./admin.server");
    return adminScreenings(await adminClient(), data.limit);
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminUsers } = await import("./admin.server");
    return adminUsers(await adminClient());
  });

/** Coordinator/admin logs the outcome of a donor call on one alert. */
export const adminRecordDonorResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        notificationId: z.string().uuid(),
        response: z.enum(["accepted", "declined"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { recordDonorResponse } = await import("./emergency.server");
    return recordDonorResponse(await adminClient(), data.notificationId, data.response);
  });

export const adminUpdateRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        status: z.enum([
          "dispatching",
          "notified",
          "accepted",
          "fulfilled",
          "timed_out",
          "cancelled",
        ]),
        resolutionNote: z.string().trim().max(400).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await adminClient();
    const { error } = await admin
      .from("emergency_requests")
      .update({
        status: data.status,
        resolution_note: data.resolutionNote || null,
      })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(ROLES),
        enabled: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.role === "admin" && !data.enabled) {
      throw new Error("You cannot remove your own admin role.");
    }
    const admin = await adminClient();
    if (data.enabled) {
      const { error } = await admin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminListTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminTemplates } = await import("./admin.server");
    return adminTemplates(await adminClient());
  });

export const adminSaveTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(80), subject: z.string().trim().max(160).default(""), body: z.string().trim().min(2).max(4000), enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await (await adminClient()).from("notification_templates").update({ name: data.name, subject: data.subject || null, body: data.body, enabled: data.enabled, updated_by: context.userId }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListAlertRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminAlertRules } = await import("./admin.server");
    return adminAlertRules(await adminClient());
  });

export const adminSaveAlertRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(2).max(100), ruleType: z.enum(["no_acceptance", "delivery_failures", "city_shortage", "critical_blood_group", "timeout_approaching", "eta_breach"]), severity: z.enum(["medium", "high", "critical"]), thresholdValue: z.number().min(0).max(10000), windowMinutes: z.number().int().min(1).max(1440), channels: z.array(z.enum(["in_app", "sms", "email", "push"])).min(1), enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await adminClient();
    const row = { name: data.name, rule_type: data.ruleType, severity: data.severity, threshold_value: data.thresholdValue, window_minutes: data.windowMinutes, channels: data.channels, enabled: data.enabled, created_by: context.userId, updated_by: context.userId };
    const result = data.id ? await admin.from("admin_alert_rules").update(row).eq("id", data.id) : await admin.from("admin_alert_rules").insert(row);
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });

export const adminListAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminAlerts } = await import("./admin.server");
    return adminAlerts(await adminClient());
  });

export const adminUpdateAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), action: z.enum(["acknowledge", "resolve"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch = data.action === "acknowledge" ? { acknowledged_at: new Date().toISOString() } : { resolved_at: new Date().toISOString() };
    const { error } = await (await adminClient()).from("admin_alerts").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRetryNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ notificationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await adminClient();
    const { data: note, error } = await admin.from("emergency_notifications").select("*, emergency_requests(*)").eq("id", data.notificationId).single();
    if (error || !note) throw new Error(error?.message ?? "Notification not found.");
    if (note.status === "sent") throw new Error("This notification was already delivered.");
    const request = note.emergency_requests as Record<string, unknown>;
    const phone = note.recipient_kind === "requester" ? String(request.contact_phone ?? "") : "";
    if (!phone) throw new Error("A retry destination is not available for this masked recipient.");
    const { sendMessage, toE164 } = await import("./emergency-notify.server");
    const outcome = await sendMessage(toE164(phone), `SANJEEVANI X: Update for request ${request.id}. Status: ${request.status}.`, note.channel === "sms" ? "sms" : "whatsapp");
    await admin.from("notification_attempts").insert({ request_id: request.id, notification_id: note.id, recipient_kind: note.recipient_kind, masked_recipient: note.masked_phone, channel: note.channel, status: outcome.status, provider_message_id: outcome.sid, error_message: outcome.error, initiated_by: context.userId });
    await admin.from("emergency_notifications").update({ status: outcome.status, provider_sid: outcome.sid, error: outcome.error }).eq("id", note.id);
    return outcome;
  });
