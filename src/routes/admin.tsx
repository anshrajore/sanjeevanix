import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { SubPage } from "@/components/SubPage";
import { DONORS, REQUESTS, cityStats, cooldownStatus, synthDonations } from "@/lib/bloodbridge";
import { Users, Activity, AlertTriangle, Trophy, Phone, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard · Sanjeevani X" }] }),
  component: AdminPage,
});

function AdminPage() {
  const stats = useMemo(() => {
    const cities = cityStats();
    const totalDonors = DONORS.length;
    const available = DONORS.filter((d) => cooldownStatus(d).state === "available").length;
    const openReqs = REQUESTS.filter((r) => r.status === "Open").length;
    const fulfilled = REQUESTS.length - openReqs;
    const flagged = DONORS.filter((d) => d.fatigue_score > 35 && d.response_rate < 80);
    const top = [...DONORS]
      .map((d) => ({ ...d, donations: synthDonations(d) }))
      .sort((a, b) => b.donations - a.donations)
      .slice(0, 8);
    const declineReasons = [
      { reason: "Travel", count: 142, pct: 32 },
      { reason: "Illness", count: 98, pct: 22 },
      { reason: "Personal", count: 76, pct: 17 },
      { reason: "No response", count: 87, pct: 19 },
      { reason: "Other", count: 44, pct: 10 },
    ];
    return { cities, totalDonors, available, openReqs, fulfilled, flagged, top, declineReasons };
  }, []);

  return (
    <SubPage
      tag="Admin Dashboard"
      title={
        <>
          Mission control for the <span className="text-gradient-red">platform</span>
        </>
      }
      subtitle="System-wide metrics, donor health, expansion cascades, and VAPI agent performance."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI icon={Users} label="Total donors" value={stats.totalDonors} sub={`${stats.available} available`} />
        <KPI icon={Activity} label="Open requests" value={stats.openReqs} sub={`${stats.fulfilled} fulfilled`} />
        <KPI icon={Phone} label="VAPI success" value="94%" sub="Last 30 days" tone="emerald" />
        <KPI icon={TrendingUp} label="Avg response" value="47s" sub="-12% vs last month" tone="cyan" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="text-xs font-mono text-white/40 uppercase mb-3">City risk overview</div>
          <div className="space-y-2">
            {stats.cities.map((c) => (
              <div key={c.city} className="flex items-center gap-3 text-sm">
                <div className="w-24 font-medium">{c.city}</div>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, c.risk * 60)}%`,
                      background:
                        c.risk >= 1 ? "#E63946" : c.risk >= 0.5 ? "#F59E0B" : "#22C55E",
                    }}
                  />
                </div>
                <div className="w-12 text-right font-mono text-xs">{c.risk.toFixed(2)}</div>
                <div className="w-20 text-right text-xs text-white/50">
                  {c.available}/{c.pending}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-mono text-white/40 uppercase mb-3">Decline reasons (30d)</div>
          {stats.declineReasons.map((r) => (
            <div key={r.reason} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>{r.reason}</span>
                <span className="text-white/40 font-mono">{r.count}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4D6D] to-[#E63946]"
                  style={{ width: `${r.pct * 2.5}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono text-white/40 uppercase">
              <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-400" />
              Flagged donors · manual review
            </div>
            <div className="text-[10px] text-white/40">3+ declines without reason</div>
          </div>
          <div className="space-y-2">
            {stats.flagged.slice(0, 6).map((d) => (
              <div
                key={d.donor_id}
                className="flex items-center justify-between p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs"
              >
                <div>
                  <span className="font-medium">{d.donor_name}</span>
                  <span className="text-white/40 ml-2">
                    {d.donor_id} · {d.city} · {d.blood_group}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/40">Fatigue {d.fatigue_score}</span>
                  <span className="text-amber-400">Resp {d.response_rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-mono text-white/40 uppercase mb-3">
            <Trophy className="w-3 h-3 inline mr-1 text-yellow-400" /> Top donors
          </div>
          {stats.top.map((d, i) => (
            <div
              key={d.donor_id}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 text-center font-mono text-white/40">#{i + 1}</div>
                <div>
                  <div className="font-medium">{d.donor_name}</div>
                  <div className="text-[10px] text-white/40">{d.city}</div>
                </div>
              </div>
              <div className="font-mono text-[#FF4D6D]">{d.donations}×</div>
            </div>
          ))}
        </div>
      </div>
    </SubPage>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  sub,
  tone = "red",
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub: string;
  tone?: "red" | "emerald" | "cyan";
}) {
  const colors = {
    red: "text-[#FF4D6D]",
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
  };
  return (
    <div className="glass rounded-2xl p-4 border border-white/10">
      <Icon className={`w-5 h-5 ${colors[tone]} mb-2`} />
      <div className="text-[10px] text-white/40 uppercase">{label}</div>
      <div className="text-2xl font-display font-bold mt-1">{value}</div>
      <div className="text-[10px] text-white/40 mt-1">{sub}</div>
    </div>
  );
}
