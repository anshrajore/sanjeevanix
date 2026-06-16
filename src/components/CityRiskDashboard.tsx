import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Activity, MapPin, Search, Radio, TrendingUp, ShieldAlert } from "lucide-react";
import { useVapi } from "@/hooks/use-vapi";

type CityRisk = {
  city: string;
  state: string;
  bloodGroup: string;
  shortage: number; // 0-100
  donors: number;
  eta: string;
  level: "critical" | "high" | "moderate" | "stable";
};

const CITY_RISKS: CityRisk[] = [
  { city: "Delhi",     state: "DL", bloodGroup: "O-",  shortage: 92, donors: 17,  eta: "2m 14s", level: "critical" },
  { city: "Pune",      state: "MH", bloodGroup: "B-",  shortage: 84, donors: 34,  eta: "3m 02s", level: "critical" },
  { city: "Nashik",    state: "MH", bloodGroup: "A+",  shortage: 71, donors: 128, eta: "1m 45s", level: "high" },
  { city: "Hyderabad", state: "TS", bloodGroup: "AB-", shortage: 68, donors: 22,  eta: "4m 10s", level: "high" },
  { city: "Kolkata",   state: "WB", bloodGroup: "A-",  shortage: 57, donors: 41,  eta: "5m 30s", level: "high" },
  { city: "Bangalore", state: "KA", bloodGroup: "O+",  shortage: 38, donors: 89,  eta: "—",       level: "moderate" },
  { city: "Mumbai",    state: "MH", bloodGroup: "O+",  shortage: 22, donors: 412, eta: "—",       level: "stable" },
  { city: "Chennai",   state: "TN", bloodGroup: "B+",  shortage: 18, donors: 305, eta: "—",       level: "stable" },
];

const LEVEL_STYLE: Record<CityRisk["level"], { bar: string; chip: string; label: string }> = {
  critical: { bar: "from-[#FF4D6D] to-[#E63946]", chip: "bg-[#E63946]/20 text-[#FF4D6D] border-[#E63946]/40", label: "Critical" },
  high:     { bar: "from-[#FF8A4D] to-[#FF4D6D]", chip: "bg-[#FF8A4D]/15 text-[#FF8A4D] border-[#FF8A4D]/40", label: "High" },
  moderate: { bar: "from-[#FFD166] to-[#FF8A4D]", chip: "bg-[#FFD166]/15 text-[#FFD166] border-[#FFD166]/30", label: "Moderate" },
  stable:   { bar: "from-emerald-400 to-emerald-600", chip: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Stable" },
};

export function CityRiskDashboard() {
  const { isActive } = useVapi();
  const highRiskCities = useMemo(
    () => CITY_RISKS.filter((c) => c.level === "critical" || c.level === "high"),
    [],
  );
  const [searchIdx, setSearchIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSearchIdx((i) => (i + 1) % highRiskCities.length), 2400);
    return () => clearInterval(t);
  }, [highRiskCities.length]);

  const target = highRiskCities[searchIdx];

  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(230,57,70,0.12),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 glass-red rounded-full px-4 py-1.5 text-xs uppercase tracking-wider mb-4">
              <ShieldAlert className="w-3 h-3" /> Predictive Risk · Live
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              City-Wise <span className="text-gradient-red">Blood Risk</span> Analytics
            </h2>
            <p className="text-white/60 max-w-2xl mt-3">
              Sanjeevani AI continuously scans demand-supply gaps across India and dispatches voice
              outreach to verified donors in the highest-risk cities first.
            </p>
          </div>

          {/* Live agent searching banner */}
          <motion.div
            key={target.city}
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
                <span className="font-semibold text-[#FF4D6D]">{target.bloodGroup}</span> in{" "}
                <span className="font-semibold">{target.city}</span>
              </span>
            </div>
            <div className="text-xs text-white/50 mt-1">
              High-risk zone · ETA {target.eta} · {target.donors} donors in radius
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Stats column */}
          <div className="space-y-4">
            {[
              { v: highRiskCities.length, l: "Cities at high risk", icon: AlertTriangle, c: "text-[#FF4D6D]" },
              { v: CITY_RISKS.reduce((s, c) => s + c.donors, 0).toLocaleString(), l: "Donors mobilizable now", icon: Activity, c: "text-emerald-400" },
              { v: "11", l: "Languages in outreach", icon: TrendingUp, c: "text-[#FFD166]" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${s.c}`}>
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
              <div className="col-span-2">Group</div>
              <div className="col-span-4">Shortage Index</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            <div className="divide-y divide-white/5">
              {CITY_RISKS.map((c) => {
                const style = LEVEL_STYLE[c.level];
                const isTarget = (c.level === "critical" || c.level === "high") && c.city === target.city;
                return (
                  <motion.div
                    key={c.city}
                    animate={isTarget ? { backgroundColor: "rgba(230,57,70,0.08)" } : { backgroundColor: "rgba(0,0,0,0)" }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-white/40" />
                      <div>
                        <div className="text-white/90 font-medium">{c.city}</div>
                        <div className="text-[10px] text-white/40 uppercase">{c.state}</div>
                      </div>
                    </div>
                    <div className="col-span-2 font-mono text-[#FF4D6D]">{c.bloodGroup}</div>
                    <div className="col-span-4">
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${c.shortage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8 }}
                          className={`h-full bg-gradient-to-r ${style.bar}`}
                        />
                      </div>
                      <div className="text-[10px] text-white/40 mt-1">{c.shortage}% shortage · {c.donors} donors</div>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <span className={`text-[10px] px-2 py-1 rounded-full border ${style.chip} uppercase tracking-wider`}>
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
