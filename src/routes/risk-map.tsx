import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SubPage } from "@/components/SubPage";
import { RiskMap } from "@/components/RiskMap";
import { cityStats, BLOOD_GROUPS, riskColor, riskLabel } from "@/lib/bloodbridge";

export const Route = createFileRoute("/risk-map")({
  head: () => ({ meta: [{ title: "Live Risk Map · Sanjeevani X" }] }),
  component: RiskMapPage,
});

function RiskMapPage() {
  const cities = useMemo(() => cityStats(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const sel = selected ? cities.find((c) => c.city === selected) : null;

  return (
    <SubPage
      tag="Live Risk Map"
      title={
        <>
          National <span className="text-gradient-red">blood supply</span> risk map
        </>
      }
      subtitle="Risk score = pending units ÷ available donors. Auto-cascade triggers expand outreach radius beyond 50km when risk crosses 0.8, 1.5, and 2.5."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RiskMap cities={cities} onCityClick={setSelected} height="540px" />
          <div className="mt-4 glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-mono text-white/50">Timeline window</div>
              <div className="flex gap-1">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setWindowDays(d as 7 | 30 | 90)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      windowDays === d ? "bg-[#FF4D6D] text-white" : "bg-white/5 text-white/60"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <Legend color="#22C55E" label="SAFE  <0.5" />
              <Legend color="#F59E0B" label="WATCH 0.5–1.0" />
              <Legend color="#E63946" label="CRITICAL >1.0" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/10">
          <div className="text-xs font-mono text-white/40 uppercase mb-2">
            {sel ? "City Detail" : "Click a city"}
          </div>
          {sel ? (
            <>
              <div className="font-display text-2xl font-bold">{sel.city}</div>
              <div
                className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  color: riskColor(sel.risk),
                  borderColor: `${riskColor(sel.risk)}55`,
                  background: `${riskColor(sel.risk)}11`,
                }}
              >
                {riskLabel(sel.risk)} · Risk {sel.risk.toFixed(2)}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Stat label="Donors avail" value={sel.available} />
                <Stat label="Open reqs" value={sel.pending} />
              </div>
              <div className="text-xs font-mono text-white/40 mt-5 mb-2">By blood group</div>
              <div className="space-y-1.5">
                {BLOOD_GROUPS.map((g) => {
                  const n = sel.byGroup[g] ?? 0;
                  const max = Math.max(...BLOOD_GROUPS.map((x) => sel.byGroup[x] ?? 0), 1);
                  return (
                    <div key={g} className="flex items-center gap-2 text-xs">
                      <div className="w-8 text-white/60 font-mono">{g}</div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF4D6D] to-[#E63946]"
                          style={{ width: `${(n / max) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-right font-mono">{n}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-2 mt-3">
              {cities
                .sort((a, b) => b.risk - a.risk)
                .slice(0, 10)
                .map((c) => (
                  <button
                    key={c.city}
                    onClick={() => setSelected(c.city)}
                    className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="text-sm">{c.city}</div>
                    <div
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        color: riskColor(c.risk),
                        background: `${riskColor(c.risk)}11`,
                      }}
                    >
                      {c.risk.toFixed(2)}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </SubPage>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="text-white/60">{label}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-black/30 rounded-lg p-3">
      <div className="text-xl font-display font-bold">{value}</div>
      <div className="text-[9px] uppercase text-white/40 mt-0.5">{label}</div>
    </div>
  );
}
