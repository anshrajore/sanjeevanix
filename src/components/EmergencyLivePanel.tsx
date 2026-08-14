import { AlertCircle, CheckCircle2, Clock, Loader2, Radio, Wifi, WifiOff } from "lucide-react";

import { formatEta } from "@/lib/city-risk";
import { formatCountdown, useEmergencyLive } from "@/hooks/use-emergency-live";

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  queued: "bg-white/5 text-white/50 border-white/10",
  skipped: "bg-[#FFD166]/15 text-[#FFD166] border-[#FFD166]/30",
  failed: "bg-[#E63946]/15 text-[#FF4D6D] border-[#E63946]/30",
};

const REQUEST_STATUS: Record<string, { label: string; tone: string; icon: typeof Radio }> = {
  dispatching: { label: "Dispatching alerts", tone: "text-[#FFD166]", icon: Loader2 },
  notified: { label: "Pool alerted — awaiting donor confirmation", tone: "text-emerald-400", icon: Radio },
  accepted: { label: "Donor accepted — coordinator confirming slot", tone: "text-emerald-400", icon: CheckCircle2 },
  fulfilled: { label: "Request fulfilled", tone: "text-emerald-400", icon: CheckCircle2 },
  timed_out: { label: "Response window closed — escalated to blood banks", tone: "text-[#FFD166]", icon: Clock },
  cancelled: { label: "Request cancelled", tone: "text-white/50", icon: AlertCircle },
  no_donors: { label: "No eligible donors matched — widen city or blood group", tone: "text-[#FFD166]", icon: AlertCircle },
  delivery_failed: { label: "Alerts could not be delivered — see log", tone: "text-[#FF4D6D]", icon: AlertCircle },
};

/**
 * Realtime view of one emergency dispatch: live status, ETA countdown and
 * per-donor delivery + response state, updated over Supabase realtime.
 */
export function EmergencyLivePanel({
  requestId,
  poolSize,
  radiusUsedKm,
}: {
  requestId: string;
  poolSize: number;
  radiusUsedKm: number;
}) {
  const live = useEmergencyLive(requestId);
  const request = live.request;
  const donors = live.notifications.filter((n) => n.recipient_kind === "donor");
  const requesterUpdates = live.notifications.filter((n) => n.recipient_kind === "requester");
  const sent = donors.filter((d) => d.status === "sent").length;
  const accepts = donors.filter((d) => d.response === "accepted").length;

  const meta = REQUEST_STATUS[request?.status ?? "dispatching"] ?? REQUEST_STATUS.dispatching;
  const StatusIcon = meta.icon;
  const windowOpen = request?.status === "notified" || request?.status === "dispatching";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 text-xs ${meta.tone}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${request?.status === "dispatching" ? "animate-spin" : ""}`} />
          {meta.label}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${
            live.connected ? "text-emerald-400" : "text-white/40"
          }`}
        >
          {live.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {live.connected ? "Live" : "Polling"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Donors alerted" value={`${sent}/${donors.length || poolSize}`} />
        <Stat
          label="Nearest ETA"
          value={request?.eta_minutes ? formatEta(request.eta_minutes) : "—"}
        />
        <Stat
          label={windowOpen ? "Window closes in" : "Acceptances"}
          value={windowOpen ? formatCountdown(live.secondsLeft) : `${accepts}`}
        />
        <Stat label="Search radius" value={`${radiusUsedKm} km`} />
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-white/40 px-3 py-2 border-b border-white/5">
          <div className="col-span-4">Donor</div>
          <div className="col-span-3">Distance / ETA</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-3 text-right">Delivery / reply</div>
        </div>
        <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
          {donors.length === 0 && (
            <div className="px-3 py-4 text-xs text-white/40">Building the donor pool…</div>
          )}
          {donors.map((d) => (
            <div key={d.id} className="grid grid-cols-12 items-center px-3 py-2.5 text-xs">
              <div className="col-span-4">
                <div className="text-white/85">{d.donor_name}</div>
                <div className="text-[10px] text-white/35 font-mono">{d.masked_phone}</div>
              </div>
              <div className="col-span-3 text-white/60">
                {d.distance_km ?? "—"} km · {d.eta_minutes ? formatEta(d.eta_minutes) : "—"}
              </div>
              <div className="col-span-2 font-mono text-[#FF4D6D]">{d.match_score ?? "—"}</div>
              <div className="col-span-3 flex justify-end items-center gap-1.5">
                {d.response && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      d.response === "accepted"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-white/5 text-white/45 border-white/10"
                    }`}
                  >
                    {d.response}
                  </span>
                )}
                <span
                  title={d.error ?? undefined}
                  className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    STATUS_STYLE[d.status] ?? STATUS_STYLE.queued
                  }`}
                >
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {requesterUpdates.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
            Updates sent to you
          </div>
          <ul className="space-y-1.5">
            {requesterUpdates.map((u) => (
              <li key={u.id} className="text-[11px] text-white/60 flex items-center gap-2">
                <span className="font-mono text-white/35">
                  {new Date(u.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {u.donor_ref.replace("requester:", "")} · {u.status}
                {u.error ? <span className="text-[#FFD166]">({u.error})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">{label}</div>
    </div>
  );
}
