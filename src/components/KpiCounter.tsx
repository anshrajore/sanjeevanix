import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

export function KpiCounter({
  icon: Icon,
  label,
  value,
  suffix = "",
  sub,
  accent = "#FF4D6D",
  live = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  suffix?: string;
  sub?: string;
  accent?: string;
  live?: boolean;
}) {
  const target = typeof value === "number" ? value : 0;
  const [display, setDisplay] = useState(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplay(value);
      return;
    }
    let raf: number;
    const start = performance.now();
    const dur = 900;
    const from = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, value]);

  return (
    <div
      className="glass rounded-2xl p-4 border border-white/10 relative overflow-hidden"
      style={{ boxShadow: `inset 0 0 0 1px ${accent}10` }}
    >
      {live && (
        <span
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: accent }}
        />
      )}
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-display font-bold mt-1 tabular-nums">
        {display}
        <span className="text-sm text-white/40 ml-1">{suffix}</span>
      </div>
      {sub && <div className="text-[10px] text-white/40 mt-1">{sub}</div>}
    </div>
  );
}
