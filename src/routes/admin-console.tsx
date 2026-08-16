import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Loader2,
  Lock,
  Radio,
  RefreshCw,
  Send,
  ShieldCheck,
  Siren,
  ThumbsDown,
  ThumbsUp,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";

import { SubPage } from "@/components/SubPage";
import { KpiCounter } from "@/components/KpiCounter";
import { RequestTimeline } from "@/components/RequestTimeline";
import { useAuth } from "@/hooks/use-auth";
import { exportRequestCsv, exportRequestPdf } from "@/lib/admin-export";
import {
  adminGetOverview,
  adminGetRequest,
  adminListAlertRules,
  adminListAlerts,
  adminListRequests,
  adminListScreenings,
  adminListTemplates,
  adminListUsers,
  adminRecordDonorResponse,
  adminRetryNotification,
  adminSaveAlertRule,
  adminSaveTemplate,
  adminSetRole,
  adminUpdateAlert,
  adminUpdateRequest,
  claimFirstAdmin,
  getMyAccess,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin-console")({
  head: () => ({
    meta: [
      { title: "Admin Console · Sanjeevani X" },
      {
        name: "description",
        content:
          "Platform-wide oversight of every emergency blood request, donor screening audit and operator role on Sanjeevani X.",
      },
      { property: "og:title", content: "Admin Console · Sanjeevani X" },
      {
        property: "og:description",
        content: "Emergency request oversight, donor screening audits and role management.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminConsole,
});

const TABS = [
  "Overview",
  "Requests",
  "Alerts",
  "Templates",
  "Screenings",
  "Operators",
] as const;
type Tab = (typeof TABS)[number];

const STATUSES = [
  "all",
  "dispatching",
  "notified",
  "accepted",
  "fulfilled",
  "timed_out",
  "cancelled",
  "no_donors",
] as const;

function AdminConsole() {
  const { user, loading } = useAuth();
  const access = useServerFn(getMyAccess);
  const claim = useServerFn(claimFirstAdmin);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("Overview");

  const me = useQuery({
    queryKey: ["admin-access", user?.id],
    queryFn: () => access(),
    enabled: Boolean(user),
  });

  const claimMutation = useMutation({
    mutationFn: () => claim(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-access", user?.id] }),
  });

  if (loading || (user && me.isLoading)) {
    return (
      <SubPage tag="Admin" title="Admin Console" subtitle="Checking your access…">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="w-4 h-4 animate-spin" /> Verifying permissions
        </div>
      </SubPage>
    );
  }

  if (!user) {
    return (
      <SubPage tag="Admin" title="Admin Console" subtitle="Sign in with an administrator account.">
        <Link
          to="/auth"
          search={{ next: "/admin-console" }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-4 py-2.5 text-sm font-medium"
        >
          <Lock className="w-4 h-4" /> Sign in
        </Link>
      </SubPage>
    );
  }

  if (!me.data?.isAdmin) {
    return (
      <SubPage
        tag="Admin"
        title="Admin Console"
        subtitle="This console is restricted to platform administrators."
      >
        <div className="glass rounded-2xl p-6 max-w-xl">
          <p className="text-sm text-white/70">
            Your account has no admin role. If this is a fresh deployment, the first signed-in user
            can claim administrator access once.
          </p>
          <button
            type="button"
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {claimMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Claim administrator access
          </button>
          {claimMutation.isError && (
            <p className="text-xs text-[#FF4D6D] mt-3">
              {claimMutation.error instanceof Error
                ? claimMutation.error.message
                : "Could not grant access."}
            </p>
          )}
        </div>
      </SubPage>
    );
  }

  return (
    <SubPage
      tag="Administrator"
      title={
        <>
          Admin <span className="text-gradient-red">Console</span>
        </>
      }
      subtitle="Every emergency request, donor screening audit and operator role across the platform."
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`text-xs rounded-lg px-3 py-2 border transition ${
              tab === t
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/[0.02] border-white/10 text-white/55 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab />}
      {tab === "Requests" && <RequestsTab />}
      {tab === "Alerts" && <AlertsTab />}
      {tab === "Templates" && <TemplatesTab />}
      {tab === "Screenings" && <ScreeningsTab />}
      {tab === "Operators" && <OperatorsTab myId={me.data.userId} />}
    </SubPage>
  );
}

function OverviewTab() {
  const fetchOverview = useServerFn(adminGetOverview);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview() });

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorBox error={q.error} />;
  const o = q.data;
  if (!o) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCounter icon={Siren} label="Total requests" value={o.totalRequests} accent="#FF4D6D" />
        <KpiCounter icon={Radio} label="Open now" value={o.openRequests} accent="#FBBF24" live />
        <KpiCounter icon={CheckCircle2} label="Accepted" value={o.acceptedRequests} accent="#34D399" />
        <KpiCounter icon={Clock} label="Timed out" value={o.timedOutRequests} accent="#EF4444" />
        <KpiCounter icon={TrendingUp} label="Acceptance" value={o.acceptanceRate} suffix="%" accent="#A78BFA" />
        <KpiCounter icon={Users} label="Registered users" value={o.registeredUsers} accent="#22D3EE" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCounter icon={Send} label="Alerts sent" value={o.alertsSent} accent="#34D399" />
        <KpiCounter icon={AlertTriangle} label="Alerts failed" value={o.alertsFailed} accent="#EF4444" />
        <KpiCounter icon={ThumbsUp} label="Donor accepts" value={o.donorAccepts} accent="#34D399" />
        <KpiCounter icon={ThumbsDown} label="Donor declines" value={o.donorDeclines} accent="#FBBF24" />
        <KpiCounter icon={Timer} label="Avg ETA" value={o.avgEtaMinutes ?? 0} suffix="m" accent="#22D3EE" />
        <KpiCounter icon={ClipboardList} label="Screenings" value={o.screenings} accent="#A78BFA" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Requests by city">
          {o.topCities.map(([city, count]) => (
            <Row key={city} left={city} right={String(count)} />
          ))}
          {o.topCities.length === 0 && <Empty>No requests dispatched yet.</Empty>}
        </Panel>
        <Panel title="Demand by blood group">
          {o.byGroup.map(([group, count]) => (
            <Row key={group} left={group} right={String(count)} />
          ))}
          {o.byGroup.length === 0 && <Empty>No demand recorded yet.</Empty>}
        </Panel>
        <Panel title="Screening health">
          <Row left="Eligible submissions" right={String(o.screeningsEligible)} />
          <Row left="Average readiness score" right={`${o.avgScreeningScore ?? "—"}`} />
        </Panel>
        <Panel title="Roles granted">
          {Object.entries(o.roleCounts).map(([role, count]) => (
            <Row key={role} left={role} right={String(count)} />
          ))}
          {Object.keys(o.roleCounts).length === 0 && <Empty>No roles assigned.</Empty>}
        </Panel>
      </div>
    </div>
  );
}

const BLOOD_GROUPS = ["all", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;
const SOURCES = ["all", "standard", "emergency"] as const;
const RISK_FLAGS = [
  "all",
  "recent_donation",
  "low_weight",
  "age_out_of_range",
  "medication",
  "infection_risk",
  "pregnancy",
] as const;
const PAGE_SIZE = 40;

const EMPTY_FILTERS = {
  status: "all",
  city: "all",
  bloodGroup: "all",
  source: "all",
  riskFlag: "all",
  from: "",
  to: "",
  search: "",
};

function RequestsTab() {
  const list = useServerFn(adminListRequests);
  const detail = useServerFn(adminGetRequest);
  const record = useServerFn(adminRecordDonorResponse);
  const update = useServerFn(adminUpdateRequest);
  const retry = useServerFn(adminRetryNotification);
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const set = (patch: Partial<typeof EMPTY_FILTERS>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(0);
  };

  const activeCount = Object.entries(filters).filter(
    ([key, value]) => value !== EMPTY_FILTERS[key as keyof typeof EMPTY_FILTERS],
  ).length;

  const requests = useQuery({
    queryKey: ["admin-requests", filters, page],
    queryFn: () =>
      list({
        data: {
          ...filters,
          from: filters.from ? new Date(filters.from).toISOString() : "",
          to: filters.to ? new Date(`${filters.to}T23:59:59`).toISOString() : "",
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
      }),
    refetchInterval: 20_000,
  });

  const selectedQuery = useQuery({
    queryKey: ["admin-request", selected],
    queryFn: () => detail({ data: { requestId: selected as string } }),
    enabled: Boolean(selected),
    refetchInterval: 15_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-request", selected] });
    void queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
  };

  const respond = useMutation({
    mutationFn: (v: { notificationId: string; response: "accepted" | "declined" }) =>
      record({ data: v }),
    onSuccess: invalidate,
  });

  const setStatusMutation = useMutation({
    mutationFn: (v: { requestId: string; status: string; resolutionNote: string }) =>
      update({ data: v } as Parameters<typeof update>[0]),
    onSuccess: invalidate,
  });

  const retryMutation = useMutation({
    mutationFn: (notificationId: string) => retry({ data: { notificationId } }),
    onSuccess: invalidate,
  });

  const cities = Array.from(new Set((requests.data ?? []).map((r) => r.city))).sort();
  const exportDetail = () => {
    const data = selectedQuery.data;
    if (!data) throw new Error("Open a request first.");
    return {
      request: data.request as unknown as Record<string, unknown>,
      notifications: data.notifications as unknown as Array<Record<string, unknown>>,
      events: data.events as unknown as Array<Record<string, unknown>>,
      screening: data.screening as unknown as Record<string, unknown> | null,
    };
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
          <Field label="Status">
            <Choice value={filters.status} onChange={(v) => set({ status: v })} options={[...STATUSES]} />
          </Field>
          <Field label="Blood group">
            <Choice
              value={filters.bloodGroup}
              onChange={(v) => set({ bloodGroup: v })}
              options={[...BLOOD_GROUPS]}
            />
          </Field>
          <Field label="City">
            <Choice
              value={filters.city}
              onChange={(v) => set({ city: v })}
              options={["all", ...cities]}
            />
          </Field>
          <Field label="Source">
            <Choice value={filters.source} onChange={(v) => set({ source: v })} options={[...SOURCES]} />
          </Field>
          <Field label="Risk flag">
            <Choice
              value={filters.riskFlag}
              onChange={(v) => set({ riskFlag: v })}
              options={[...RISK_FLAGS]}
            />
          </Field>
          <Field label="Search">
            <input
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
              placeholder="Patient, hospital, request ID…"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs"
            />
          </Field>
          <Field label="From date">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => set({ from: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs"
            />
          </Field>
          <Field label="To date">
            <input
              type="date"
              value={filters.to}
              onChange={(e) => set({ to: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs"
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/45">
          <span>
            {activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? "s" : ""} active` : "No filters applied"}
          </span>
          <button
            type="button"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(0);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void requests.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${requests.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <span className="ml-auto font-mono">Page {page + 1}</span>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={(requests.data ?? []).length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {requests.isLoading ? (
        <Loading />
      ) : requests.isError ? (
        <ErrorBox error={requests.error} />
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-white/40 px-3 py-2 border-b border-white/5">
            <div className="col-span-3">Patient</div>
            <div className="col-span-2">Group / units</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-2">Pool</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          <div className="divide-y divide-white/5">
            {(requests.data ?? []).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r.id === selected ? null : r.id)}
                className={`w-full grid grid-cols-12 items-center px-3 py-2.5 text-xs text-left hover:bg-white/[0.03] ${
                  selected === r.id ? "bg-white/[0.05]" : ""
                }`}
              >
                <div className="col-span-3">
                  <div className="text-white/85">{r.patient_name}</div>
                  <div className="text-[10px] text-white/35">
                    {new Date(r.created_at).toLocaleString("en-IN")} · {r.request_source}
                  </div>
                </div>
                <div className="col-span-2 font-mono text-[#FF4D6D]">
                  {r.blood_group} · {r.units_needed}u
                </div>
                <div className="col-span-3 text-white/60">{r.hospital || r.city}</div>
                <div className="col-span-2 text-white/60">
                  {r.accepted_count}/{r.notified_count} accepted
                </div>
                <div className="col-span-2 text-right text-white/70">{r.status}</div>
              </button>
            ))}
            {(requests.data ?? []).length === 0 && <Empty>No requests match this filter.</Empty>}
          </div>
        </div>
      )}

      {selected && (
        <div className="glass rounded-2xl p-5">
          {selectedQuery.isLoading ? (
            <Loading />
          ) : !selectedQuery.data ? (
            <Empty>Request not found.</Empty>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-bold">
                    {selectedQuery.data.request.patient_name} ·{" "}
                    {selectedQuery.data.request.blood_group}
                  </div>
                  <div className="text-xs text-white/45">
                    {selectedQuery.data.request.hospital || selectedQuery.data.request.city} · window
                    closes {new Date(selectedQuery.data.request.expires_at).toLocaleTimeString("en-IN")}
                  </div>
                  <div className="text-[11px] text-white/35 mt-1">
                    Requester: {selectedQuery.data.requester?.full_name ?? "—"} ·{" "}
                    {selectedQuery.data.request.contact_phone ?? "no phone"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => exportRequestCsv(exportDetail())}
                    className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportRequestPdf(exportDetail())}
                    className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </button>
                  {(["accepted", "fulfilled", "cancelled"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={setStatusMutation.isPending}
                      onClick={() =>
                        setStatusMutation.mutate({
                          requestId: selectedQuery.data!.request.id,
                          status: s,
                          resolutionNote: `Marked ${s} from admin console`,
                        })
                      }
                      className="text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5"
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-3">
                    Lifecycle timeline
                  </div>
                  <RequestTimeline events={selectedQuery.data.events} />
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                    Matching, delivery and donor replies
                  </div>
                  <div className="divide-y divide-white/5">
                    {selectedQuery.data.notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs"
                      >
                        <div>
                          <div className="text-white/85">
                            {n.donor_name}{" "}
                            <span className="text-white/35 font-mono">{n.masked_phone}</span>
                          </div>
                          <div className="text-[10px] text-white/40">
                            {n.recipient_kind} · {n.channel} · {n.status}
                            {n.error ? ` · ${n.error}` : ""}
                            {n.eta_minutes ? ` · ETA ${n.eta_minutes}m` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {n.status !== "sent" && (
                            <button
                              type="button"
                              disabled={retryMutation.isPending}
                              onClick={() => retryMutation.mutate(n.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1"
                            >
                              <Send className="w-3 h-3" /> Resend
                            </button>
                          )}
                          {n.recipient_kind === "donor" &&
                            (n.response ? (
                              <span
                                className={
                                  n.response === "accepted" ? "text-emerald-400" : "text-white/45"
                                }
                              >
                                {n.response}
                              </span>
                            ) : (
                              (["accepted", "declined"] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  disabled={respond.isPending}
                                  onClick={() => respond.mutate({ notificationId: n.id, response: r })}
                                  className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1"
                                >
                                  Log {r}
                                </button>
                              ))
                            ))}
                        </div>
                      </div>
                    ))}
                    {selectedQuery.data.notifications.length === 0 && (
                      <Empty>No notifications dispatched for this request.</Empty>
                    )}
                  </div>

                  {selectedQuery.data.screening && (
                    <div className="mt-4 rounded-xl border border-white/10 p-3 text-[11px] text-white/60">
                      <div className="text-white/80 mb-1">Latest screening audit</div>
                      Eligible: {String(selectedQuery.data.screening.eligible)} · score{" "}
                      {selectedQuery.data.screening.score}
                      {selectedQuery.data.screening.deferral_reason
                        ? ` · ${selectedQuery.data.screening.deferral_reason}`
                        : ""}
                    </div>
                  )}
                </div>
              </div>

              {(respond.isError || setStatusMutation.isError || retryMutation.isError) && (
                <ErrorBox
                  error={respond.error ?? setStatusMutation.error ?? retryMutation.error}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 block">
      <span className="text-[10px] uppercase tracking-wider text-white/35">{label}</span>
      {children}
    </label>
  );
}

function Choice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function ScreeningsTab() {
  const listScreenings = useServerFn(adminListScreenings);
  const q = useQuery({
    queryKey: ["admin-screenings"],
    queryFn: () => listScreenings({ data: { limit: 50 } }),
  });

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorBox error={q.error} />;

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-white/40 px-3 py-2 border-b border-white/5">
        <div className="col-span-4">Submitted</div>
        <div className="col-span-2">Score</div>
        <div className="col-span-3">Flags</div>
        <div className="col-span-3 text-right">Outcome</div>
      </div>
      <div className="divide-y divide-white/5">
        {(q.data ?? []).map((s) => (
          <div key={s.id} className="grid grid-cols-12 items-center px-3 py-2.5 text-xs">
            <div className="col-span-4 text-white/70">
              {new Date(s.created_at).toLocaleString("en-IN")}
              <div className="text-[10px] text-white/35">{s.source}</div>
            </div>
            <div className="col-span-2 font-mono text-[#FF4D6D]">{s.score}/100</div>
            <div className="col-span-3 text-white/60">
              {Array.isArray(s.flags) ? s.flags.length : 0} flags
            </div>
            <div className="col-span-3 text-right">
              <span className={s.eligible ? "text-emerald-400" : "text-[#FF4D6D]"}>
                {s.eligible ? "eligible" : "deferred"}
              </span>
              {s.deferral_reason && (
                <div className="text-[10px] text-white/35 truncate">{s.deferral_reason}</div>
              )}
            </div>
          </div>
        ))}
        {(q.data ?? []).length === 0 && <Empty>No screenings submitted yet.</Empty>}
      </div>
    </div>
  );
}

function OperatorsTab({ myId }: { myId: string }) {
  const listUsers = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);
  const queryClient = useQueryClient();

  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsers() });
  const mutate = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "coordinator" | "user"; enabled: boolean }) =>
      setRole({ data: v }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorBox error={q.error} />;

  return (
    <div className="space-y-3">
      {mutate.isError && <ErrorBox error={mutate.error} />}
      <div className="rounded-2xl border border-white/10 divide-y divide-white/5">
        {(q.data ?? []).map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-xs">
            <div>
              <div className="text-white/85">
                {u.full_name ?? "Unnamed user"}
                {u.id === myId && <span className="text-white/35"> · you</span>}
              </div>
              <div className="text-[10px] text-white/40">
                {u.city ?? "—"} · {u.blood_group ?? "—"} · {u.phone ?? "no phone"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["admin", "coordinator", "user"] as const).map((role) => {
                const on = u.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={mutate.isPending}
                    onClick={() => mutate.mutate({ userId: u.id, role, enabled: !on })}
                    className={`rounded-lg border px-2.5 py-1 transition ${
                      on
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-white/[0.02] border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {(q.data ?? []).length === 0 && <Empty>No registered users yet.</Empty>}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between text-xs border-b border-white/5 last:border-0 py-1.5">
      <span className="text-white/70">{left}</span>
      <span className="font-mono text-[#FF4D6D]">{right}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-4 text-xs text-white/40">{children}</div>;
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-sm text-white/50">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
    </div>
  );
}

function ErrorBox({ error }: { error: unknown }) {
  return (
    <p className="text-xs text-[#FF4D6D]">
      {error instanceof Error ? error.message : "Something went wrong."}
    </p>
  );
}
