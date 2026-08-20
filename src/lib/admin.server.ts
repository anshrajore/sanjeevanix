import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminRequestFilter = {
  status: string;
  city: string;
  bloodGroup: string;
  source: string;
  riskFlag: string;
  from: string;
  to: string;
  search: string;
  limit: number;
  offset: number;
};

const REQUEST_LIST_FIELDS =
  "id, created_by, patient_name, blood_group, units_needed, city, hospital, hospital_id, hospital_contact_phone, contact_phone, urgency, status, request_source, risk_flags, eta_minutes, notified_count, accepted_count, expires_at, resolution_note, created_at, updated_at";

/** Every emergency request across the platform, newest first. */
export async function adminRequests(admin: SupabaseClient, filter: AdminRequestFilter) {
  let query = admin
    .from("emergency_requests")
    .select(REQUEST_LIST_FIELDS)
    .order("created_at", { ascending: false })
    .range(filter.offset, filter.offset + filter.limit - 1);

  if (filter.status !== "all") query = query.eq("status", filter.status);
  if (filter.city !== "all") query = query.eq("city", filter.city);
  if (filter.bloodGroup !== "all") query = query.eq("blood_group", filter.bloodGroup);
  if (filter.source !== "all") query = query.eq("request_source", filter.source);
  if (filter.riskFlag !== "all") query = query.contains("risk_flags", [filter.riskFlag]);
  if (filter.from) query = query.gte("created_at", filter.from);
  if (filter.to) query = query.lte("created_at", filter.to);
  if (filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    query = query.or(`id::text.ilike.${s},patient_name.ilike.${s},hospital.ilike.${s},city.ilike.${s}`);
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

  const [{ data: notifications }, { data: requester }, { data: events }, { data: screening }] = await Promise.all([
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
    admin
      .from("emergency_request_events")
      .select("id, event_type, title, detail, actor_kind, channel, status, eta_minutes, metadata, created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true }),
    admin
      .from("eligibility_audit")
      .select("id, answers, flags, eligible, score, deferral_reason, next_eligible_date, source, created_at")
      .eq("user_id", request.created_by)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return { request, notifications: notifications ?? [], requester: requester ?? null, events: events ?? [], screening: screening ?? null };
}

export async function adminTemplates(admin: SupabaseClient) {
  const { data, error } = await admin.from("notification_templates").select("*").order("event_type");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminAlertRules(admin: SupabaseClient) {
  const { data, error } = await admin.from("admin_alert_rules").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminAlerts(admin: SupabaseClient) {
  const { data, error } = await admin.from("admin_alerts").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
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

/* ------------------------------------------------------------------ */
/* Analytics                                                          */
/* ------------------------------------------------------------------ */

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

/** Rich analytics aggregates for the admin analytics dashboard. */
export async function adminAnalytics(admin: SupabaseClient, days: number) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const [requests, notifications, screenings, events, hospitals, voice] = await Promise.all([
    admin
      .from("emergency_requests")
      .select(
        "id, status, city, blood_group, urgency, units_needed, accepted_count, notified_count, eta_minutes, request_source, created_at, updated_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(2000),
    admin
      .from("emergency_notifications")
      .select("status, channel, response, recipient_kind, created_at, responded_at, match_score, distance_km")
      .gte("created_at", since)
      .limit(5000),
    admin
      .from("eligibility_audit")
      .select("eligible, score, deferral_reason, created_at")
      .gte("created_at", since)
      .limit(3000),
    admin
      .from("emergency_request_events")
      .select("request_id, event_type, created_at")
      .gte("created_at", since)
      .limit(5000),
    admin.from("hospital_directory").select("city, state, country, blood_bank_available, verification_status").eq("active", true).limit(2000),
    admin.from("voice_call_logs").select("outcome, duration_seconds, created_at").gte("created_at", since).limit(2000),
  ]);

  const reqRows = requests.data ?? [];
  const noteRows = notifications.data ?? [];
  const donorNotes = noteRows.filter((n) => n.recipient_kind === "donor");
  const scrRows = screenings.data ?? [];
  const eventRows = events.data ?? [];
  const voiceRows = voice.data ?? [];

  // Daily time series
  const series = new Map<string, { day: string; requests: number; accepted: number; notifications: number; screenings: number }>();
  const ensure = (day: string) => {
    if (!series.has(day)) series.set(day, { day, requests: 0, accepted: 0, notifications: 0, screenings: 0 });
    return series.get(day)!;
  };
  for (let i = days - 1; i >= 0; i -= 1) ensure(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  for (const r of reqRows) {
    const bucket = ensure(dayKey(r.created_at));
    bucket.requests += 1;
    if ((r.accepted_count ?? 0) > 0) bucket.accepted += 1;
  }
  for (const n of noteRows) ensure(dayKey(n.created_at)).notifications += 1;
  for (const s of scrRows) ensure(dayKey(s.created_at)).screenings += 1;

  // Distributions
  const tally = <T extends string>(rows: Array<Record<string, unknown>>, key: string) => {
    const out: Record<string, number> = {};
    for (const row of rows) {
      const value = String(row[key] ?? "unknown") as T;
      out[value] = (out[value] ?? 0) + 1;
    }
    return Object.entries(out)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Channel delivery performance
  const channelMap = new Map<string, { channel: string; sent: number; failed: number; accepted: number; declined: number }>();
  for (const n of donorNotes) {
    const channel = String(n.channel ?? "unknown");
    const row = channelMap.get(channel) ?? { channel, sent: 0, failed: 0, accepted: 0, declined: 0 };
    if (n.status === "sent" || n.status === "delivered") row.sent += 1;
    if (n.status === "failed" || n.status === "skipped") row.failed += 1;
    if (n.response === "accepted") row.accepted += 1;
    if (n.response === "declined") row.declined += 1;
    channelMap.set(channel, row);
  }

  // Donor response latency (minutes)
  const latencies = donorNotes
    .filter((n) => n.responded_at)
    .map((n) => (new Date(n.responded_at as string).getTime() - new Date(n.created_at).getTime()) / 60_000)
    .filter((m) => m >= 0 && m < 24 * 60);
  const avgResponseMinutes = latencies.length
    ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
    : null;

  // Time to first acceptance per request (minutes)
  const firstEvent = new Map<string, number>();
  for (const e of eventRows) {
    if (e.event_type !== "donor_accepted") continue;
    const ts = new Date(e.created_at).getTime();
    const prev = firstEvent.get(e.request_id);
    if (prev == null || ts < prev) firstEvent.set(e.request_id, ts);
  }
  const fulfilTimes: number[] = [];
  for (const r of reqRows) {
    const accepted = firstEvent.get(r.id);
    if (accepted) fulfilTimes.push((accepted - new Date(r.created_at).getTime()) / 60_000);
  }
  const avgTimeToAcceptMinutes = fulfilTimes.length
    ? Math.round((fulfilTimes.reduce((a, b) => a + b, 0) / fulfilTimes.length) * 10) / 10
    : null;

  // City demand vs hospital supply coverage
  const cityDemand: Record<string, number> = {};
  for (const r of reqRows) cityDemand[r.city] = (cityDemand[r.city] ?? 0) + (r.units_needed ?? 1);
  const cityBanks: Record<string, number> = {};
  for (const h of hospitals.data ?? []) {
    if (h.blood_bank_available) cityBanks[h.city] = (cityBanks[h.city] ?? 0) + 1;
  }
  const cityCoverage = Object.entries(cityDemand)
    .map(([city, units]) => ({ city, units, bloodBanks: cityBanks[city] ?? 0, pressure: Math.round((units / Math.max(1, cityBanks[city] ?? 0)) * 10) / 10 }))
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, 12);

  const accepted = reqRows.filter((r) => (r.accepted_count ?? 0) > 0).length;
  const notified = donorNotes.length;
  const deliverySent = donorNotes.filter((n) => n.status === "sent" || n.status === "delivered").length;

  return {
    windowDays: days,
    series: [...series.values()].sort((a, b) => a.day.localeCompare(b.day)),
    byStatus: tally(reqRows, "status"),
    byGroup: tally(reqRows, "blood_group"),
    byUrgency: tally(reqRows, "urgency"),
    bySource: tally(reqRows, "request_source"),
    byCity: tally(reqRows, "city").slice(0, 10),
    channels: [...channelMap.values()],
    funnel: [
      { stage: "Requests", value: reqRows.length },
      { stage: "Donors notified", value: notified },
      { stage: "Delivered", value: deliverySent },
      { stage: "Donor accepted", value: donorNotes.filter((n) => n.response === "accepted").length },
      { stage: "Fulfilled", value: reqRows.filter((r) => r.status === "fulfilled").length },
    ],
    screening: {
      total: scrRows.length,
      eligible: scrRows.filter((s) => s.eligible).length,
      avgScore: scrRows.length ? Math.round(scrRows.reduce((a, b) => a + b.score, 0) / scrRows.length) : null,
      deferrals: tally(scrRows.filter((s) => !s.eligible), "deferral_reason").slice(0, 8),
    },
    voice: {
      total: voiceRows.length,
      byOutcome: tally(voiceRows, "outcome"),
      avgDurationSeconds: voiceRows.length
        ? Math.round(voiceRows.reduce((a, b) => a + (b.duration_seconds ?? 0), 0) / voiceRows.length)
        : null,
    },
    network: {
      hospitals: (hospitals.data ?? []).length,
      bloodBanks: (hospitals.data ?? []).filter((h) => h.blood_bank_available).length,
      verified: (hospitals.data ?? []).filter((h) => h.verification_status === "verified").length,
      countries: new Set((hospitals.data ?? []).map((h) => h.country)).size,
      cities: new Set((hospitals.data ?? []).map((h) => h.city)).size,
    },
    kpis: {
      totalRequests: reqRows.length,
      acceptanceRate: reqRows.length ? Math.round((accepted / reqRows.length) * 100) : 0,
      deliveryRate: notified ? Math.round((deliverySent / notified) * 100) : 0,
      avgResponseMinutes,
      avgTimeToAcceptMinutes,
      avgUnits: reqRows.length
        ? Math.round((reqRows.reduce((a, b) => a + (b.units_needed ?? 0), 0) / reqRows.length) * 10) / 10
        : 0,
    },
    cityCoverage,
  };
}
