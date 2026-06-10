import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SubPage } from "@/components/SubPage";
import {
  REQUESTS,
  DONORS,
  URGENCY_LABEL,
  cooldownStatus,
  type BBRequest,
} from "@/lib/bloodbridge";
import { Phone, Check, X, Clock, ShieldCheck, MapPin, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Blood Requests · Sanjeevani X" }] }),
  component: RequestsPage,
});

type CallState = "idle" | "dialing" | "speaking" | "accepted" | "declined" | "no-answer";

function VapiCallSimulator({ request, onClose }: { request: BBRequest; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [calls, setCalls] = useState<Record<string, CallState>>({});
  const [otp, setOtp] = useState<string | null>(null);
  const queue = useMemo(
    () =>
      request.assigned_donor_pool
        .map((id) => DONORS.find((d) => d.donor_id === id))
        .filter(Boolean)
        .slice(0, 8) as (typeof DONORS)[number][],
    [request],
  );

  const dial = async (idx: number) => {
    if (idx >= queue.length) return;
    const d = queue[idx];
    setCalls((p) => ({ ...p, [d.donor_id]: "dialing" }));
    setStep(idx);
    await new Promise((r) => setTimeout(r, 1200));
    setCalls((p) => ({ ...p, [d.donor_id]: "speaking" }));
    await new Promise((r) => setTimeout(r, 1800));
    // 60% acceptance based on acceptance_prediction
    const accept = d.acceptance_prediction > 80 || Math.random() > 0.5;
    if (accept) {
      setCalls((p) => ({ ...p, [d.donor_id]: "accepted" }));
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setOtp(code);
    } else {
      const out: CallState = Math.random() > 0.3 ? "declined" : "no-answer";
      setCalls((p) => ({ ...p, [d.donor_id]: out }));
      await new Promise((r) => setTimeout(r, 800));
      dial(idx + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass border border-white/10 rounded-3xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-mono text-[#FF4D6D]">VAPI VOICE AGENT · LIVE</div>
            <div className="font-display text-2xl font-bold mt-1">{request.patient_name}</div>
            <div className="text-sm text-white/60">
              {request.blood_group} · {request.units_needed}u · {request.hospital}
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {otp && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl"
          >
            <div className="text-xs text-emerald-300 font-mono mb-1">✓ DONOR CONFIRMED · OTP DISPATCHED</div>
            <div className="font-display text-4xl font-bold tracking-[0.5em] text-emerald-300">{otp}</div>
            <div className="text-xs text-white/50 mt-2">
              Sent via SMS to donor + hospital coordinator. Calendar invite issued. Expires 4h after appointment.
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {queue.map((d, i) => {
            const s = calls[d.donor_id] ?? "idle";
            const active = i === step && s !== "idle";
            return (
              <div
                key={d.donor_id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  active
                    ? "border-[#FF4D6D]/60 bg-[#FF4D6D]/5"
                    : s === "accepted"
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : s === "declined" || s === "no-answer"
                        ? "border-white/5 bg-white/[0.02] opacity-50"
                        : "border-white/10 bg-black/30"
                }`}
              >
                <div className="text-xs font-mono text-white/40 w-6">#{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {d.donor_name.slice(0, 1)}*** {d.donor_name.split(" ").slice(-1)[0]?.slice(0, 1)}***
                  </div>
                  <div className="text-[10px] text-white/40">
                    {d.blood_group} · {d.language} · accept {d.acceptance_prediction}%
                  </div>
                </div>
                <CallStatePill state={s} />
              </div>
            );
          })}
        </div>

        {!otp && step === 0 && calls[queue[0]?.donor_id] === undefined && (
          <button
            onClick={() => dial(0)}
            className="mt-6 w-full bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white font-medium py-3 rounded-xl glow-red"
          >
            <Phone className="w-4 h-4 inline mr-2" /> Start VAPI Outreach
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function CallStatePill({ state }: { state: CallState }) {
  const map: Record<CallState, { l: string; c: string; icon: typeof Phone }> = {
    idle: { l: "queued", c: "text-white/40", icon: Clock },
    dialing: { l: "dialing…", c: "text-[#FF4D6D] animate-pulse", icon: Phone },
    speaking: { l: "speaking", c: "text-cyan-400 animate-pulse", icon: Phone },
    accepted: { l: "ACCEPTED", c: "text-emerald-400", icon: Check },
    declined: { l: "declined", c: "text-white/40", icon: X },
    "no-answer": { l: "no answer", c: "text-white/40", icon: AlertTriangle },
  };
  const v = map[state];
  const Icon = v.icon;
  return (
    <div className={`text-[10px] font-mono flex items-center gap-1 ${v.c}`}>
      <Icon className="w-3 h-3" />
      {v.l}
    </div>
  );
}

function RequestsPage() {
  const [active, setActive] = useState<BBRequest | null>(null);
  return (
    <SubPage
      tag="Live Requests"
      title={
        <>
          Active blood <span className="text-gradient-red">requests</span>
        </>
      }
      subtitle="Each request triggers an 8-donor priority queue. The VAPI agent dials donors one by one, captures responses, and confirms the first acceptance."
    >
      <div className="grid lg:grid-cols-2 gap-4">
        {REQUESTS.map((r) => {
          const u = URGENCY_LABEL[r.urgency] ?? URGENCY_LABEL[3];
          const available = r.assigned_donor_pool.filter((id) => {
            const d = DONORS.find((x) => x.donor_id === id);
            return d && cooldownStatus(d).state === "available";
          }).length;
          return (
            <motion.div
              key={r.request_id}
              whileHover={{ y: -2 }}
              className="glass rounded-2xl p-5 border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[10px] font-mono text-white/40">{r.request_id}</div>
                  <div className="font-display text-lg font-semibold mt-0.5">{r.patient_name}</div>
                  <div className="text-xs text-white/50 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {r.hospital}, {r.city}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{ background: `${u.color}22`, color: u.color, border: `1px solid ${u.color}55` }}
                  >
                    {u.label}
                  </div>
                  <div className="text-2xl font-display font-bold mt-2 text-[#FF4D6D]">
                    {r.blood_group}
                  </div>
                  <div className="text-[10px] text-white/40">{r.units_needed} units</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5">
                <div>
                  <div className="text-sm font-bold">{r.assigned_donor_pool.length}</div>
                  <div className="text-[9px] text-white/40 uppercase">Queue</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-400">{available}</div>
                  <div className="text-[9px] text-white/40 uppercase">Available</div>
                </div>
                <div>
                  <div className="text-sm font-bold">{r.backup_donor_pool.length}</div>
                  <div className="text-[9px] text-white/40 uppercase">Backup</div>
                </div>
              </div>

              <div className="text-[10px] text-white/40 mt-3">
                <ShieldCheck className="w-3 h-3 inline mr-1 text-emerald-400" />
                Need by {r.required_before} · Source: {r.request_source}
              </div>

              <button
                onClick={() => setActive(r)}
                className="mt-4 w-full bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white text-sm font-medium py-2 rounded-lg hover:scale-[1.02] transition-transform"
              >
                <Phone className="w-3 h-3 inline mr-1" /> Trigger VAPI Outreach
              </button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {active && <VapiCallSimulator request={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </SubPage>
  );
}
