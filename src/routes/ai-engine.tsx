import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Radio,
  Search,
  User,
} from "lucide-react";
import { SubPage } from "@/components/SubPage";
import { VapiTalkButton } from "@/components/VapiTalkButton";
import {
  BLOOD_GROUPS,
  CITIES,
  LANGUAGES,
  URGENCIES,
  advanceOutreachStatus,
  runDonorMatch,
  type BloodGroup,
  type DonorLanguage,
  type DonorMatch,
  type MatchRequest,
  type OutreachStatus,
  type Urgency,
} from "@/lib/donor-matching";

export const Route = createFileRoute("/ai-engine")({
  head: () => ({ meta: [{ title: "AI Matching Engine · Sanjeevani X" }] }),
  component: AIEnginePage,
});

const STATUS_LABEL: Record<OutreachStatus, string> = {
  available: "Available",
  contacted: "Contacted",
  confirmed: "Confirmed",
  "en-route": "En-route",
  declined: "Declined",
};

const STATUS_STYLE: Record<OutreachStatus, string> = {
  available: "bg-white/10 text-white/70",
  contacted: "bg-orange-500/20 text-orange-300",
  confirmed: "bg-cyan-500/20 text-cyan-300",
  "en-route": "bg-green-500/20 text-green-300",
  declined: "bg-red-500/20 text-red-300",
};

function AIEnginePage() {
  const [params, setParams] = useState<MatchRequest>({
    bloodGroup: "O+",
    city: "Mumbai",
    language: "Any",
    minTrustScore: 70,
    minAvailability: 70,
    urgency: "High",
  });
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof runDonorMatch> | null>(null);
  const [donors, setDonors] = useState<DonorMatch[]>([]);
  const [trackingLog, setTrackingLog] = useState<string[]>([]);

  const statusCounts = useMemo(() => {
    return donors.reduce(
      (acc, d) => {
        acc[d.outreachStatus] += 1;
        return acc;
      },
      { available: 0, contacted: 0, confirmed: 0, "en-route": 0, declined: 0 } as Record<
        OutreachStatus,
        number
      >,
    );
  }, [donors]);

  const handleMatch = async () => {
    setMatching(true);
    setTrackingLog([]);
    await new Promise((r) => setTimeout(r, 600));
    const match = runDonorMatch(params);
    setResult(match);
    setDonors(match.donors);
    setTrackingLog([
      `Scanned ${match.stats.totalScanned} donors from Sanjeevani network`,
      `${match.stats.compatible} compatible donors for ${params.bloodGroup}`,
      `${match.stats.inCity} donors in ${params.city} · avg ${match.stats.avgDistance} km away`,
      `Top match: ${match.donors[0]?.donor_name ?? "none"} (score ${match.donors[0]?.matchScore ?? 0})`,
    ]);
    setMatching(false);
  };

  const contactDonor = (id: string) => {
    setDonors((prev) =>
      prev.map((d) =>
        d.donor_id === id
          ? {
              ...d,
              outreachStatus:
                d.outreachStatus === "available"
                  ? "contacted"
                  : advanceOutreachStatus(d.outreachStatus),
            }
          : d,
      ),
    );
    const donor = donors.find((d) => d.donor_id === id);
    if (donor) {
      setTrackingLog((log) => [
        ...log,
        `Voice outreach → ${donor.donor_name} · ${donor.language} · +${donor.phone}`,
      ]);
    }
  };

  const declineDonor = (id: string) => {
    setDonors((prev) =>
      prev.map((d) => (d.donor_id === id ? { ...d, outreachStatus: "declined" } : d)),
    );
    const donor = donors.find((d) => d.donor_id === id);
    if (donor) {
      setTrackingLog((log) => [...log, `${donor.donor_name} declined — next nearest donor queued`]);
    }
  };

  return (
    <SubPage
      tag="AI Engine"
      title={
        <>
          The <span className="text-gradient-red">Matching</span> Engine
        </>
      }
      subtitle="Search 500 live donors — ranked by nearest city, trust score, availability, and acceptance prediction."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 space-y-4 lg:col-span-1">
          <h3 className="font-display text-xl font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-[#FF4D6D]" /> Search parameters
          </h3>

          <div>
            <label
              htmlFor="match_blood_group"
              className="text-xs uppercase tracking-wider text-white/40"
            >
              Blood group needed
            </label>
            <select
              id="match_blood_group"
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5"
              value={params.bloodGroup}
              onChange={(e) =>
                setParams((p) => ({ ...p, bloodGroup: e.target.value as BloodGroup }))
              }
            >
              {BLOOD_GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="match_city" className="text-xs uppercase tracking-wider text-white/40">
              Your city (nearest first)
            </label>
            <select
              id="match_city"
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5"
              value={params.city}
              onChange={(e) => setParams((p) => ({ ...p, city: e.target.value }))}
            >
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="match_language"
              className="text-xs uppercase tracking-wider text-white/40"
            >
              Preferred language
            </label>
            <select
              id="match_language"
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5"
              value={params.language}
              onChange={(e) =>
                setParams((p) => ({ ...p, language: e.target.value as DonorLanguage }))
              }
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="match_urgency"
              className="text-xs uppercase tracking-wider text-white/40"
            >
              Urgency
            </label>
            <select
              id="match_urgency"
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5"
              value={params.urgency}
              onChange={(e) => setParams((p) => ({ ...p, urgency: e.target.value as Urgency }))}
            >
              {URGENCIES.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="match_trust" className="text-xs uppercase tracking-wider text-white/40">
              Min trust score ({params.minTrustScore})
            </label>
            <input
              id="match_trust"
              type="range"
              min={50}
              max={99}
              className="mt-2 w-full accent-[#FF4D6D]"
              value={params.minTrustScore}
              onChange={(e) => setParams((p) => ({ ...p, minTrustScore: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label
              htmlFor="match_availability"
              className="text-xs uppercase tracking-wider text-white/40"
            >
              Min availability ({params.minAvailability})
            </label>
            <input
              id="match_availability"
              type="range"
              min={50}
              max={99}
              className="mt-2 w-full accent-[#FF4D6D]"
              value={params.minAvailability}
              onChange={(e) =>
                setParams((p) => ({ ...p, minAvailability: Number(e.target.value) }))
              }
            />
          </div>

          <button
            type="button"
            disabled={matching}
            onClick={() => void handleMatch()}
            className="w-full bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white py-3 rounded-xl glow-red font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {matching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Finding nearest donors…
              </>
            ) : (
              "Find Nearest Donors"
            )}
          </button>

          <VapiTalkButton
            className="w-full glass-red rounded-xl px-4 py-3 font-medium flex items-center justify-center gap-2"
            inactiveLabel="Talk to AI for live help"
            activeLabel="End AI call"
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {result && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { l: "In DB", v: result.stats.totalScanned },
                { l: "Compatible", v: result.stats.compatible },
                { l: "In city", v: result.stats.inCity },
                { l: "Avg trust", v: `${result.stats.avgTrust}%` },
                { l: "Avg avail.", v: `${result.stats.avgAvailability}%` },
                { l: "Avg dist.", v: `${result.stats.avgDistance} km` },
              ].map((s) => (
                <div key={s.l} className="glass rounded-xl p-3 text-center">
                  <div className="font-display text-xl font-bold text-gradient-red">{s.v}</div>
                  <div className="text-[10px] text-white/50 mt-1 uppercase tracking-wide">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="glass-red rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold">Nearest donor matches</h3>
              {result && (
                <span className="font-mono text-xs text-white/40">{result.requestId}</span>
              )}
            </div>

            {!donors.length ? (
              <p className="text-white/50 text-sm">
                Set your city and blood group, then search to see the nearest compatible donors from
                the 500-donor network.
              </p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {donors.map((d, index) => (
                  <motion.div
                    key={d.donor_id}
                    layout
                    className="flex flex-col sm:flex-row sm:items-center gap-3 bg-black/30 rounded-xl p-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        <User className="w-3.5 h-3.5 text-white/40" />
                        {d.donor_name}
                        <span className="text-xs text-white/40 font-mono">{d.donor_id}</span>
                        <span className="font-display text-sm text-gradient-red">
                          {d.matchScore}
                        </span>
                      </div>
                      <div className="text-xs text-white/50 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                        <span className="font-medium text-white/70">{d.blood_group}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {d.distanceKm} km · {d.city}
                        </span>
                        <span>Trust {d.trust_score}%</span>
                        <span>Avail {d.availability_score}%</span>
                        <span>Accept {d.acceptance_prediction}%</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {d.language}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/35 mt-0.5">
                        Response {d.response_rate}% · Reliability {d.donation_reliability}% ·
                        Fatigue {d.fatigue_score} · Last donated {d.daysSinceDonation}d ago
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_STYLE[d.outreachStatus]}`}
                    >
                      {STATUS_LABEL[d.outreachStatus]}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => contactDonor(d.donor_id)}
                        disabled={
                          d.outreachStatus === "declined" || d.outreachStatus === "en-route"
                        }
                        className="text-xs bg-[#E63946] px-3 py-1.5 rounded-md font-medium disabled:opacity-40 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {d.outreachStatus === "available" ? "Contact" : "Advance"}
                      </button>
                      <button
                        type="button"
                        onClick={() => declineDonor(d.donor_id)}
                        disabled={d.outreachStatus === "declined"}
                        className="text-xs bg-white/5 px-3 py-1.5 rounded-md disabled:opacity-40"
                      >
                        Decline
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF4D6D]" /> Outreach pipeline
              </h4>
              <div className="space-y-2">
                {(Object.keys(statusCounts) as OutreachStatus[]).map((status) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-white/60 capitalize">{STATUS_LABEL[status]}</span>
                    <span className="font-mono">{statusCounts[status]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF4D6D]" /> Live tracking log
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {trackingLog.length === 0 ? (
                  <p className="text-xs text-white/40">No events yet.</p>
                ) : (
                  trackingLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubPage>
  );
}
