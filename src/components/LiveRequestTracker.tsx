import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import type { BBRequest } from "@/lib/bloodbridge";

const STAGES = [
  "Request Created",
  "AI Searching",
  "Donors Matched",
  "Verification",
  "Appointment Scheduled",
  "Donation In Progress",
  "Blood Ready",
  "Request Completed",
];

export function LiveRequestTracker({ request, auto = true }: { request: BBRequest; auto?: boolean }) {
  const [stage, setStage] = useState(2);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setStage((s) => (s >= STAGES.length - 1 ? 2 : s + 1));
    }, 4000);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono mb-1">
            Live Request · {request.request_id}
          </div>
          <div className="font-display text-lg font-semibold">
            {request.patient_name}{" "}
            <span className="text-[#FF4D6D]">{request.blood_group}</span>{" "}
            <span className="text-white/40 font-mono text-sm">· {request.units_needed}u</span>
          </div>
          <div className="text-xs text-white/50 mt-0.5">
            {request.hospital} · {request.city}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs glass-red rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] animate-pulse" />
          <span className="text-[#FF8A9A] font-mono uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/5" />
        <div
          className="absolute top-3 left-3 h-0.5 bg-gradient-to-r from-[#FF4D6D] to-[#E63946] transition-all duration-700"
          style={{ width: `calc(${(stage / (STAGES.length - 1)) * 100}% - 12px)` }}
        />
        <div className="relative grid grid-cols-8 gap-1">
          {STAGES.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <div key={s} className="flex flex-col items-center text-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? "bg-[#FF4D6D] text-white"
                      : active
                        ? "bg-white text-[#0F172A] ring-4 ring-[#FF4D6D]/30"
                        : "bg-white/5 text-white/30"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : active ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Circle className="w-2 h-2" />
                  )}
                </div>
                <div
                  className={`text-[9px] mt-2 leading-tight font-medium ${
                    active ? "text-white" : done ? "text-white/60" : "text-white/30"
                  }`}
                >
                  {s}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/5">
        <Stat label="Primary pool" value={request.assigned_donor_pool.length} />
        <Stat label="Backup pool" value={request.backup_donor_pool.length} />
        <Stat label="Urgency" value={`L${request.urgency}`} />
        <Stat label="Required" value={request.required_before.split(" ")[0]} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
      <div className="font-display font-semibold text-sm mt-0.5">{value}</div>
    </div>
  );
}
