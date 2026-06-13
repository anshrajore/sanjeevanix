import { CheckCircle2, Clock } from "lucide-react";
import type { BBDonor } from "@/lib/bloodbridge";
import { cooldownStatus, daysSince } from "@/lib/bloodbridge";

const STEPS = [
  "Registered",
  "Verified",
  "Matched",
  "Appointment Scheduled",
  "Donation Completed",
  "Recovery Period",
  "Eligible Again",
];

export function DonorTimeline({ donor }: { donor: BBDonor }) {
  const cd = cooldownStatus(donor);
  const days = daysSince(donor.last_donation_date);
  // Active step: 5 (recovery) if cooldown, 6 (eligible) if available
  const active = cd.state === "cooldown" ? 5 : 6;
  const pct = cd.state === "cooldown" ? Math.min(100, (days / 90) * 100) : 100;

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono mb-1">
            Donor Journey
          </div>
          <div className="font-display text-lg font-semibold">{donor.donor_name}</div>
        </div>
        {cd.state === "cooldown" ? (
          <div className="text-right">
            <div className="text-2xl font-display font-bold text-[#FBBF24] tabular-nums">
              {cd.daysLeft}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              days to next eligible
            </div>
          </div>
        ) : (
          <div className="glass-red rounded-full px-3 py-1 text-xs text-[#34D399] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
            Eligible Now
          </div>
        )}
      </div>

      <div className="space-y-3">
        {STEPS.map((s, i) => {
          const done = i < active;
          const isActive = i === active;
          return (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  done
                    ? "bg-[#34D399]/20 text-[#34D399]"
                    : isActive
                      ? "bg-[#FBBF24]/20 text-[#FBBF24] ring-2 ring-[#FBBF24]/40"
                      : "bg-white/5 text-white/30"
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1">
                <div
                  className={`text-sm font-medium ${
                    isActive ? "text-white" : done ? "text-white/70" : "text-white/40"
                  }`}
                >
                  {s}
                </div>
                {isActive && cd.state === "cooldown" && (
                  <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FBBF24] to-[#34D399] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
