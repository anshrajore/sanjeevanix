import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Activity,
  MapPin,
  Search,
  Radio,
  Droplets,
  ShieldAlert,
  HeartPulse,
} from "lucide-react";

import { useVapi } from "@/hooks/use-vapi";
import { useCityRisk } from "@/hooks/use-city-risk";
import { formatEta, type RiskLevel } from "@/lib/city-risk";

const LEVEL_STYLE: Record<RiskLevel, { bar: string; chip: string; label: string }> = {
  critical: {
    bar: "from-[#FF4D6D] to-[#E63946]",
    chip: "bg-[#E63946]/20 text-[#FF4D6D] border-[#E63946]/40",
    label: "Critical",
  },
  high: {
    bar: "from-[#FF8A4D] to-[#FF4D6D]",
    chip: "bg-[#FF8A4D]/15 text-[#FF8A4D] border-[#FF8A4D]/40",
    label: "High",
  },
  moderate: {
    bar: "from-[#FFD166] to-[#FF8A4D]",
    chip: "bg-[#FFD166]/15 text-[#FFD166] border-[#FFD166]/30",
    label: "Moderate",
  },
  stable: {
    bar: "from-emerald-400 to-emerald-600",
    chip: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    label: "Stable",
  },
};

export function CityRiskDashboard() {
  const { isActive } = useVapi();
  const { snapshot } = useCityRisk();

  const highRiskCities = useMemo(
    () => snapshot.cities.filter((c) => c.level === "critical" || c.level === "high"),
    [snapshot],
  );
  const [searchIdx, setSearchIdx] = useState(0);

  useEffect(() => {
    if (highRiskCities.length === 0) return;
    const t = setInterval(
      () => setSearchIdx((i) => (i + 1) % highRiskCities.length),
      2400,
    );
    return () => clearInterval(t);
  }, [highRiskCities.length]);

  const target = highRiskCities[searchIdx % Math.max(1, highRiskCities.length)] ?? snapshot.cities[0];

  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(230,57,70,0.12),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 glass-red rounded-full px-4 py-1.5 text-xs uppercase tracking-wider mb-4">
              <ShieldAlert className="w-3 h-3" /> Predictive Risk · Live feed
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              City-Wise <span className="text-gradient-red">Blood Risk</span> Analytics
            </h2>
            <p className="text-white/60 max-w-2xl mt-3">
              Computed live from {snapshot.cities.reduce((s, c) => s + c.totalDonors, 0)} registered
              donors, hospital inventory and the open request queue. Sanjeevani AI dispatches voice
              outreach to the highest-risk cities first.
            </p>
          </div>

          {/* Live agent searching banner */}
          <motion.div
            key={`${target.city}-${target.criticalGroup}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-red rounded-2xl px-5 py-4 min-w-[280px]"
          >
            <div className="flex items-center gap-2 text-xs text-[#FF4D6D] uppercase tracking-wider mb-1">
              <Radio className={`w-3 h-3 ${isActive ? "animate-pulse" : ""}`} /> Agent Activity
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Search className="w-4 h-4 text-[#FF4D6D] animate-pulse" />
              <span className="text-white/90">
                Searching donors for{" "}
                <span className="font-semibold text-[#FF4D6D]">{target.criticalGroup}</span> in{" "}
                <span className="font-semibold">{target.city}</span>
              </span>
            </div>
            <div className="text-xs text-white/50 mt-1">
              {LEVEL_STYLE[target.level].label} risk zone · ETA {formatEta(target.etaMinutes)} ·{" "}
              {target.eligibleDonors} eligible donors
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Stats column */}
          <div className="space-y-4">
            {[
              {
                v: snapshot.totals.citiesAtRisk,
                l: "Cities at high risk",
                icon: AlertTriangle,
                c: "text-[#FF4D6D]",
              },
              {
                v: snapshot.totals.mobilizableDonors.toLocaleString(),
                l: "Donors mobilizable now",
                icon: Activity,
                c: "text-emerald-400",
              },
              {
                v: `${snapshot.totals.supplyUnits}u / ${snapshot.totals.demandUnits}u`,
                l: "Supply vs demand today",
                icon: Droplets,
                c: "text-[#22D3EE]",
              },
              {
                v: snapshot.totals.thalassemiaLoad,
                l: "Thalassemia patients in cycle",
                icon: HeartPulse,
                c: "text-[#FFD166]",
              },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl p-5 flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${s.c}`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{s.v}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider mt-0.5">{s.l}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="lg:col-span-2 glass rounded-2xl p-2 overflow-hidden">
            <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-white/40 px-4 py-3 border-b border-white/5">
              <div className="col-span-4">City</div>
              <div className="col-span-2">Critical group</div>
              <div className="col-span-4">Shortage Index</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            <div className="divide-y divide-white/5">
              {snapshot.cities.map((c) => {
                const style = LEVEL_STYLE[c.level];
                const isTarget = c.city === target.city;
                return (
                  <motion.div
                    key={c.city}
                    animate={
                      isTarget
                        ? { backgroundColor: "rgba(230,57,70,0.08)" }
                        : { backgroundColor: "rgba(0,0,0,0)" }
                    }
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-white/40" />
                      <div>
                        <div className="text-white/90 font-medium">{c.city}</div>
                        <div className="text-[10px] text-white/40 uppercase">
                          {c.region} · {c.openRequests} open · {c.thalassemiaLoad} thal.
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 font-mono text-[#FF4D6D]">{c.criticalGroup}</div>
                    <div className="col-span-4">
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          animate={{ width: `${c.shortage}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full bg-gradient-to-r ${style.bar}`}
                        />
                      </div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {c.shortage}% shortage · {c.supplyUnits}u stock · {c.eligibleDonors} eligible
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full border ${style.chip} uppercase tracking-wider`}
                      >
                        {style.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
