import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { SubPage } from "@/components/SubPage";
import { KpiCounter } from "@/components/KpiCounter";
import { LiveRequestTracker } from "@/components/LiveRequestTracker";
import { DONORS, REQUESTS, URGENCY_LABEL } from "@/lib/bloodbridge";
import hospitalsRaw from "@/data/hospitals.json";
import { Activity, Droplet, Calendar, AlertTriangle, Users } from "lucide-react";

type Hospital = { hospital_id: string; name: string; city: string } & Record<string, number | string>;

export const Route = createFileRoute("/hospital-dashboard")({
  head: () => ({ meta: [{ title: "Hospital Command · Sanjeevani X" }] }),
  component: HospitalDashboard,
});

function HospitalDashboard() {
  const hospital = (hospitalsRaw as Hospital[])[0];
  const data = useMemo(() => {
    const reqs = REQUESTS.filter((r) => r.hospital === hospital.name || r.city === hospital.city);
    const open = reqs.filter((r) => r.status === "Open");
    const critical = reqs.filter((r) => r.urgency >= 4);
    const groups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
    const inv = groups.map((g) => ({ g, units: Number(hospital[g] ?? 0) }));
    const totalUnits = inv.reduce((s, x) => s + x.units, 0);
    const cityDonors = DONORS.filter((d) => d.city === hospital.city);
    return { reqs, open, critical, inv, totalUnits, cityDonors };
  }, [hospital]);

  return (
    <SubPage
      tag="Hospital Command Center"
      title={
        <>
          {hospital.name} <span className="text-gradient-red">Operations</span>
        </>
      }
      subtitle="Live requests, blood inventory, donor tracking and appointment queue — synchronized via Sanjeevani AI."
    >
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCounter icon={Activity} label="Active Requests" value={data.open.length} accent="#22D3EE" live />
        <KpiCounter icon={Droplet} label="Available Units" value={data.totalUnits} accent="#FF4D6D" />
        <KpiCounter icon={Calendar} label="Pending Appts" value={6} accent="#FBBF24" />
        <KpiCounter icon={AlertTriangle} label="Critical Cases" value={data.critical.length} accent="#E63946" live />
        <KpiCounter icon={Users} label="City Donors" value={data.cityDonors.length} accent="#A78BFA" />
      </div>

      {data.open[0] && (
        <div className="mb-6">
          <LiveRequestTracker request={data.open[0]} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-4">
            Live Request Queue
          </div>
          <div className="space-y-2">
            {data.reqs.slice(0, 8).map((r) => {
              const u = URGENCY_LABEL[r.urgency] ?? URGENCY_LABEL[3];
              return (
                <div
                  key={r.request_id}
                  className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg text-sm hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ background: `${u.color}22`, color: u.color }}
                    >
                      {u.label}
                    </span>
                    <div>
                      <div className="font-medium">{r.patient_name}</div>
                      <div className="text-[10px] text-white/40">
                        {r.request_id} · {r.patient_type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#FF4D6D] font-mono font-bold">{r.blood_group}</span>
                    <span className="text-white/40">{r.units_needed}u</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        r.status === "Open"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-4">
            Blood Inventory
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.inv.map((b) => (
              <div
                key={b.g}
                className={`rounded-lg p-3 border ${
                  b.units === 0
                    ? "border-red-500/30 bg-red-500/5"
                    : b.units < 2
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-emerald-500/20 bg-emerald-500/5"
                }`}
              >
                <div className="text-lg font-display font-bold">{b.g}</div>
                <div className="text-2xl font-mono tabular-nums">{b.units}</div>
                <div className="text-[10px] text-white/40 uppercase">units</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SubPage>
  );
}
