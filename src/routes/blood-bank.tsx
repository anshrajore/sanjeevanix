import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { SubPage } from "@/components/SubPage";
import { KpiCounter } from "@/components/KpiCounter";
import hospitalsRaw from "@/data/hospitals.json";
import { REQUESTS, BLOOD_GROUPS } from "@/lib/bloodbridge";
import { Database, Clock, AlertTriangle, ArrowRightLeft } from "lucide-react";

type Hospital = { hospital_id: string; name: string; city: string } & Record<string, number | string>;

export const Route = createFileRoute("/blood-bank")({
  head: () => ({ meta: [{ title: "Blood Bank · Sanjeevani X" }] }),
  component: BloodBankDashboard,
});

function BloodBankDashboard() {
  const data = useMemo(() => {
    const hospitals = hospitalsRaw as Hospital[];
    const totals = BLOOD_GROUPS.map((g) => ({
      g,
      units: hospitals.reduce((s, h) => s + Number(h[g] ?? 0), 0),
    }));
    const total = totals.reduce((s, x) => s + x.units, 0);
    const reserved = Math.round(total * 0.18);
    const expiring = Math.round(total * 0.11);
    const emergency = REQUESTS.filter((r) => r.urgency >= 4 && r.status === "Open");
    return { hospitals, totals, total, reserved, expiring, emergency };
  }, []);

  return (
    <SubPage
      tag="Blood Bank Operations"
      title={
        <>
          National <span className="text-gradient-red">Inventory Grid</span>
        </>
      }
      subtitle="Cross-hospital inventory, reservation requests, expiry monitoring and emergency reroute orchestration."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCounter icon={Database} label="Units Available" value={data.total} accent="#A78BFA" live />
        <KpiCounter icon={ArrowRightLeft} label="Reserved" value={data.reserved} accent="#22D3EE" />
        <KpiCounter icon={Clock} label="Expiring (7d)" value={data.expiring} accent="#FBBF24" />
        <KpiCounter icon={AlertTriangle} label="Emergency Reqs" value={data.emergency.length} accent="#E63946" live />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 lg:col-span-2 overflow-x-auto">
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-4">
            Cross-Hospital Inventory Grid
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/40 border-b border-white/5">
                <th className="text-left py-2 font-medium">Hospital</th>
                {BLOOD_GROUPS.map((g) => (
                  <th key={g} className="text-center py-2 font-mono">
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.hospitals.map((h) => (
                <tr key={h.hospital_id} className="border-b border-white/[0.03]">
                  <td className="py-2.5">
                    <div className="font-medium text-sm">{h.name}</div>
                    <div className="text-[10px] text-white/40">{h.city}</div>
                  </td>
                  {BLOOD_GROUPS.map((g) => {
                    const u = Number(h[g] ?? 0);
                    return (
                      <td key={g} className="text-center py-2.5">
                        <span
                          className={`inline-flex w-7 h-7 items-center justify-center rounded font-mono tabular-nums text-xs ${
                            u === 0
                              ? "bg-red-500/10 text-red-400"
                              : u < 2
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {u}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-4">
            National Totals by Group
          </div>
          <div className="space-y-3">
            {data.totals.map((t) => {
              const max = Math.max(...data.totals.map((x) => x.units));
              return (
                <div key={t.g}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono font-bold">{t.g}</span>
                    <span className="text-white/40 tabular-nums">{t.units} units</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#A78BFA] to-[#FF4D6D]"
                      style={{ width: `${(t.units / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SubPage>
  );
}
