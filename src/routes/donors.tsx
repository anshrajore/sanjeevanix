import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SubPage } from "@/components/SubPage";
import { DONORS, BLOOD_GROUPS, cooldownStatus, synthDonations } from "@/lib/bloodbridge";
import { Search, Shield, Award, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/donors")({
  head: () => ({
    meta: [
      { title: "Donor Directory · Sanjeevani X" },
      {
        name: "description",
        content: "Privacy-first donor directory. Names and blood groups only — contact via AI voice agent.",
      },
    ],
  }),
  component: DonorsPage,
});

function DonorsPage() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const cities = useMemo(() => Array.from(new Set(DONORS.map((d) => d.city))).sort(), []);

  const filtered = useMemo(() => {
    return DONORS.filter((d) => {
      if (group !== "all" && d.blood_group !== group) return false;
      if (city !== "all" && d.city !== city) return false;
      if (q && !d.donor_name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }).slice(0, 60);
  }, [q, group, city]);

  return (
    <SubPage
      tag="Donor Directory"
      title={
        <>
          Privacy-first <span className="text-gradient-red">donor network</span>
        </>
      }
      subtitle="Names and blood groups only. Phone numbers are encrypted — all contact is routed through Sanjeevani's AI voice agent."
    >
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-black/40 rounded-lg px-3 py-2 border border-white/10">
          <Search className="w-4 h-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name…"
            className="bg-transparent outline-none text-sm flex-1 text-white"
          />
        </div>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="all">All groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="all">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="text-xs text-white/50 ml-auto flex items-center gap-1">
          <Shield className="w-3 h-3 text-emerald-400" />
          Showing {filtered.length} of {DONORS.length} (privacy mask on)
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d, i) => {
          const cd = cooldownStatus(d);
          const donations = synthDonations(d);
          const badge =
            cd.state === "available"
              ? { label: "AVAILABLE", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" }
              : cd.state === "cooldown"
                ? {
                    label: `COOLDOWN · ${cd.daysLeft}d`,
                    color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                  }
                : { label: "INACTIVE", color: "bg-gray-500/20 text-gray-300 border-gray-500/40" };
          return (
            <motion.div
              key={d.donor_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015 }}
              className={`glass rounded-2xl p-5 border border-white/10 ${cd.state === "cooldown" ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-display font-semibold text-lg">{d.donor_name}</div>
                  <div className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {d.city}
                  </div>
                </div>
                <div className="text-2xl font-display font-bold text-[#FF4D6D]">
                  {d.blood_group}
                </div>
              </div>

              <div className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded-full border ${badge.color}`}>
                {badge.label}
              </div>
              {cd.state === "cooldown" && (
                <div className="text-xs text-white/40 mt-1">Eligible again {cd.nextEligible}</div>
              )}

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
                <div>
                  <div className="text-sm font-bold">{donations}</div>
                  <div className="text-[9px] text-white/40 uppercase">Donations</div>
                </div>
                <div>
                  <div className="text-sm font-bold">{d.response_rate}%</div>
                  <div className="text-[9px] text-white/40 uppercase">Response</div>
                </div>
                <div>
                  <div className="text-sm font-bold">{d.trust_score}</div>
                  <div className="text-[9px] text-white/40 uppercase">Trust</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Link
                  to="/donor/$id"
                  params={{ id: d.donor_id }}
                  className="flex-1 text-center text-xs py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Award className="w-3 h-3 inline mr-1" /> Profile
                </Link>
                <button
                  disabled={cd.state !== "available"}
                  className="flex-1 text-xs py-2 rounded-lg bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Phone className="w-3 h-3 inline mr-1" /> AI Contact
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SubPage>
  );
}
