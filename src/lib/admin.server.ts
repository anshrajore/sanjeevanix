import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminRequestFilter = {
  status: string;
  city: string;
  search: string;
  limit: number;
};

const REQUEST_LIST_FIELDS =
  "id, created_by, patient_name, blood_group, units_needed, city, hospital, contact_phone, urgency, status, eta_minutes, notified_count, accepted_count, expires_at, resolution_note, created_at, updated_at";

/** Every emergency request across the platform, newest first. */
export async function adminRequests(admin: SupabaseClient, filter: AdminRequestFilter) {
  let query = admin
    .from("emergency_requests")
    .select(REQUEST_LIST_FIELDS)
    .order("created_at", { ascending: false })
    .limit(filter.limit);

  if (filter.status !== "all") query = query.eq("status", filter.status);
  if (filter.city !== "all") query = query.eq("city", filter.city);
  if (filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    query = query.or(`patient_name.ilike.${s},hospital.ilike.${s},city.ilike.${s}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminRequestDetail(admin: SupabaseClient, requestId: string) {
  const { data: request, error } = await admin
    .from("emergency_requests")
    .select(REQUEST_LIST_FIELDS)
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!request) return null;

  const [{ data: notifications }, { data: requester }] = await Promise.all([
    admin
      .from("emergency_notifications")
      .select(
        "id, donor_ref, donor_name, masked_phone, recipient_kind, channel, status, error, response, responded_at, distance_km, eta_minutes, match_score, created_at",
      )
      .eq("request_id", requestId)
      .order("created_at", { ascending: true }),
    admin
      .from("profiles")
      .select("id, full_name, phone, city, blood_group")
      .eq("id", request.created_by)
      .maybeSingle(),
  ]);

  return { request, notifications: notifications ?? [], requester: requester ?? null };
}

/** Platform-wide operational metrics for the admin console. */
export async function adminOverview(admin: SupabaseClient) {
  const [requests, notifications, screenings, roles, profiles] = await Promise.all([
    admin
      .from("emergency_requests")
      .select("status, city, blood_group, accepted_count, notified_count, eta_minutes, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("emergency_notifications").select("status, response, recipient_kind").limit(2000),
    admin.from("eligibility_audit").select("eligible, score, created_at").limit(1000),
    admin.from("user_roles").select("role"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const reqRows = requests.data ?? [];
  const noteRows = (notifications.data ?? []).filter((n) => n.recipient_kind === "donor");
  const scrRows = screenings.data ?? [];

  const byStatus: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  const byGroup: Record<string, number> = {};
  for (const r of reqRows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    byCity[r.city] = (byCity[r.city] ?? 0) + 1;
    byGroup[r.blood_group] = (byGroup[r.blood_group] ?? 0) + 1;
  }

  const accepted = reqRows.filter((r) => (r.accepted_count ?? 0) > 0).length;
  const etas = reqRows.map((r) => r.eta_minutes).filter((n): n is number => typeof n === "number");
  const roleCounts: Record<string, number> = {};
  for (const r of roles.data ?? []) roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;

  return {
    totalRequests: reqRows.length,
    openRequests: reqRows.filter((r) => r.status === "dispatching" || r.status === "notified")
      .length,
    acceptedRequests: accepted,
    timedOutRequests: byStatus["timed_out"] ?? 0,
    acceptanceRate: reqRows.length ? Math.round((accepted / reqRows.length) * 100) : 0,
    alertsSent: noteRows.filter((n) => n.status === "sent").length,
    alertsFailed: noteRows.filter((n) => n.status === "failed" || n.status === "skipped").length,
    donorAccepts: noteRows.filter((n) => n.response === "accepted").length,
    donorDeclines: noteRows.filter((n) => n.response === "declined").length,
    avgEtaMinutes: etas.length ? Math.round(etas.reduce((a, b) => a + b, 0) / etas.length) : null,
    screenings: scrRows.length,
    screeningsEligible: scrRows.filter((s) => s.eligible).length,
    avgScreeningScore: scrRows.length
      ? Math.round(scrRows.reduce((a, b) => a + b.score, 0) / scrRows.length)
      : null,
    registeredUsers: profiles.count ?? 0,
    roleCounts,
    byStatus,
    topCities: Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8),
    byGroup: Object.entries(byGroup).sort((a, b) => b[1] - a[1]),
  };
}

/** Screening audit trail across all donors, with requester identity attached. */
export async function adminScreenings(admin: SupabaseClient, limit: number) {
  const { data, error } = await admin
    .from("eligibility_audit")
    .select(
      "id, user_id, answers, flags, eligible, score, deferral_reason, next_eligible_date, source, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminUsers(admin: SupabaseClient) {
  const [{ data: profiles, error }, { data: roles }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, phone, city, blood_group, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin.from("user_roles").select("user_id, role"),
  ]);
  if (error) throw new Error(error.message);

  const roleMap = new Map<string, string[]>();
  for (const r of roles ?? []) {
    roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
  }

  return (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
}
