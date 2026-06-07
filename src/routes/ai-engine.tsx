import { createFileRoute } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";

export const Route = createFileRoute("/ai-engine")({
  head: () => ({ meta: [{ title: "AI Matching Engine · Sanjeevani X" }] }),
  component: () => (
    <SubPage tag="AI Engine" title={<>The <span className="text-gradient-red">Matching</span> Engine</>} subtitle="Run a simulated match. See how Sanjeevani scores donors by trust, distance, availability, and acceptance prediction.">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-8 space-y-4">
          <h3 className="font-display text-2xl font-semibold">Request parameters</h3>
          {["Blood Group", "City", "Urgency", "Patient age", "Hospital"].map((f) => (
            <div key={f}>
              <label className="text-xs uppercase tracking-wider text-white/40">{f}</label>
              <input className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5" placeholder={f} />
            </div>
          ))}
          <button className="w-full bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white py-3 rounded-xl glow-red font-medium">Run Matching</button>
        </div>
        <div className="glass-red rounded-2xl p-8">
          <h3 className="font-display text-2xl font-semibold mb-4">Top Matches</h3>
          {[
            { n: "Rohit S.", d: "2.4 km", t: 94, a: 91 },
            { n: "Priya M.", d: "3.8 km", t: 91, a: 88 },
            { n: "Anil K.", d: "5.1 km", t: 89, a: 85 },
            { n: "Sneha P.", d: "6.7 km", t: 87, a: 82 },
          ].map((d) => (
            <div key={d.n} className="flex items-center gap-3 bg-black/30 rounded-xl p-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center font-bold text-sm">{d.n[0]}</div>
              <div className="flex-1">
                <div className="font-medium">{d.n}</div>
                <div className="text-xs text-white/50">{d.d} · Trust {d.t}% · Accept {d.a}%</div>
              </div>
              <div className="font-display text-2xl text-gradient-red">{Math.round((d.t + d.a) / 2)}</div>
            </div>
          ))}
        </div>
      </div>
    </SubPage>
  ),
});
