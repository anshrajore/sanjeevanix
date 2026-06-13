import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { SubPage } from "@/components/SubPage";
import { KpiCounter } from "@/components/KpiCounter";
import {
  DONORS,
  REQUESTS,
  cityStats,
  cooldownStatus,
  synthDonations,
} from "@/lib/bloodbridge";
import hospitalsRaw from "@/data/hospitals.json";
import {
  Users,
  Activity,
  AlertTriangle,
  Trophy,
  Phone,
  TrendingUp,
  Heart,
  Building2,
  Droplet,
  Cpu,
  Zap,
  Award,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Executive Command · Sanjeevani X" }] }),
  component: AdminPage,
});

function AdminPage() {
  const stats = useMemo(() => {
    const cities = cityStats();
    const totalDonors = DONORS.length;
    const available = DONORS.filter((d) => cooldownStatus(d).state === "available").length;
    const openReqs = REQUESTS.filter((r) => r.status === "Open").length;
    const fulfilled = REQUESTS.length - openReqs;
    const hospitals = (hospitalsRaw as { hospital_id: string }[]).length;
    const totalDonations = DONORS.reduce((s, d) => s + synthDonations(d), 0);
    const thalassemia = REQUESTS.filter((r) => r.patient_type === "Thalassemia").length;
    const flagged = DONORS.filter((d) => d.fatigue_score > 35 && d.response_rate < 80);
    const top = [...DONORS]
      .map((d) => ({ ...d, donations: synthDonations(d) }))
      .sort((a, b) => b.donations - a.donations)
      .slice(0, 6);
    return {
      cities,
      totalDonors,
      available,
      openReqs,
      fulfilled,
      hospitals,
      totalDonations,
      thalassemia,
      flagged,
      top,
    };
  }, []);

  return (
    <SubPage
      tag="Executive Command Center"
      title={
        <>
          National <span className="text-gradient-red">Mission Control</span>
        </>
      }
      subtitle="The single pane of glass across donors, hospitals, blood banks, AI agents and Blood Warriors."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <KpiCounter icon={Users} label="Total Donors" value={stats.totalDonors} accent="#FF4D6D" live />
        <KpiCounter icon={Activity} label="Active Requests" value={stats.openReqs} accent="#FBBF24" live />
        <KpiCounter icon={Heart} label="Patients Supported" value={stats.fulfilled + stats.openReqs} accent="#A78BFA" />
        <KpiCounter icon={Building2} label="Hospitals" value={stats.hospitals} accent="#22D3EE" />
        <KpiCounter icon={Droplet} label="Units Coordinated" value={stats.totalDonations} accent="#34D399" />
        <KpiCounter icon={Award} label="Lives Impacted" value={stats.totalDonations * 3} accent="#FF4D6D" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCounter icon={TrendingUp} label="Success Rate" value={94} suffix="%" accent="#34D399" />
        <KpiCounter icon={Zap} label="Avg Fulfillment" value={47} suffix="s" accent="#FBBF24" />
        <KpiCounter icon={Cpu} label="AI Accuracy" value={94.2 as unknown as number} suffix="%" accent="#A78BFA" live />
        <KpiCounter icon={Phone} label="VAPI Success" value={91} suffix="%" accent="#22D3EE" />
        <KpiCounter icon={Heart} label="Thalassemia Pts" value={stats.thalassemia} accent="#FF4D6D" />
        <KpiCounter icon={AlertTriangle} label="Emergencies" value={REQUESTS.filter((r) => r.urgency >= 4).length} accent="#EF4444" live />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
            City risk overview
          </div>
          <div className="space-y-2">
            {stats.cities.map((c) => (
              <div key={c.city} className="flex items-center gap-3 text-sm">
                <div className="w-24 font-medium">{c.city}</div>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, c.risk * 60)}%`,
                      background: c.risk >= 1 ? "#E63946" : c.risk >= 0.5 ? "#F59E0B" : "#22C55E",
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
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
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

        <div className="glass rounded-2xl p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono text-white/40 uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-400" />
              Flagged donors · manual review
            </div>
            <div className="text-[10px] text-white/40">High fatigue + low response rate</div>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {stats.flagged.slice(0, 8).map((d) => (
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
      </div>
    </SubPage>
  );
}
