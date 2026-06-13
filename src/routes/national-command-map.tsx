import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { SubPage } from "@/components/SubPage";
import { RiskMap } from "@/components/RiskMap";
import { KpiCounter } from "@/components/KpiCounter";
import { cityStats, DONORS, REQUESTS } from "@/lib/bloodbridge";
import { Activity, MapPin, AlertTriangle, Users } from "lucide-react";

export const Route = createFileRoute("/national-command-map")({
  head: () => ({ meta: [{ title: "National Command Map · Sanjeevani X" }] }),
  component: NationalCommandMap,
});

const SEVERITY = [
  { label: "Safe", color: "#22C55E", range: "0 – 0.3" },
  { label: "Watch", color: "#FBBF24", range: "0.3 – 0.6" },
  { label: "Elevated", color: "#FB923C", range: "0.6 – 1.0" },
  { label: "Critical", color: "#EF4444", range: "1.0 – 2.0" },
  { label: "Catastrophic", color: "#7F1D1D", range: "2.0+" },
];

function severityColor(r: number): string {
  if (r >= 2) return "#7F1D1D";
  if (r >= 1) return "#EF4444";
  if (r >= 0.6) return "#FB923C";
  if (r >= 0.3) return "#FBBF24";
  return "#22C55E";
}

function NationalCommandMap() {
  const [forecast, setForecast] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const cities = useMemo(() => cityStats(), []);
  const projected = cities.map((c) => ({
    ...c,
    risk: Math.max(0, c.risk * (1 + forecast * 0.15)),
  }));
  const critical = projected.filter((c) => c.risk >= 1).length;
  const totalAvailable = projected.reduce((s, c) => s + c.available, 0);
  const totalPending = projected.reduce((s, c) => s + c.pendingUnits, 0);

  return (
    <SubPage
      tag="National Risk Map"
      title={
        <>
          India <span className="text-gradient-red">Blood Supply Grid</span>
        </>
      }
      subtitle="Live national heatmap of blood demand, supply, donor availability and forecast pressure."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCounter icon={MapPin} label="Cities Tracked" value={cities.length} accent="#22D3EE" />
        <KpiCounter icon={Users} label="Available Donors" value={totalAvailable} accent="#34D399" live />
        <KpiCounter icon={Activity} label="Pending Units" value={totalPending} accent="#FBBF24" live />
        <KpiCounter icon={AlertTriangle} label="Critical Cities" value={critical} accent="#EF4444" live />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass rounded-2xl p-2 relative overflow-hidden">
          <RiskMap cities={projected} height="560px" />
          <div className="absolute top-4 left-4 glass rounded-xl px-3 py-2 z-[400] border border-white/10">
            <div className="text-[9px] uppercase tracking-wider text-white/40 font-mono">
              Live Feed · tick {tick}
            </div>
            <div className="text-sm font-display font-bold flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
              {DONORS.length} donors · {REQUESTS.length} requests
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
              Demand Forecast
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={forecast}
              onChange={(e) => setForecast(Number(e.target.value))}
              className="w-full accent-[#FF4D6D]"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1 font-mono">
              <span>Now</span>
              <span>+{forecast * 15}% load</span>
              <span>+150%</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
              Severity Legend
            </div>
            <div className="space-y-2">
              {SEVERITY.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }}
                  />
                  <span className="flex-1 font-medium">{s.label}</span>
                  <span className="text-[10px] text-white/40 font-mono">{s.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
              Top Risk Cities
            </div>
            {[...projected]
              .sort((a, b) => b.risk - a.risk)
              .slice(0, 5)
              .map((c) => (
                <div key={c.city} className="flex items-center justify-between py-1.5 text-xs border-b border-white/5 last:border-0">
                  <span>{c.city}</span>
                  <span
                    className="px-2 py-0.5 rounded font-mono text-[10px]"
                    style={{ background: `${severityColor(c.risk)}22`, color: severityColor(c.risk) }}
                  >
                    {c.risk.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </SubPage>
  );
}
