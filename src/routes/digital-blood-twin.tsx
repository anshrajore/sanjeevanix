import { createFileRoute } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";

export const Route = createFileRoute("/digital-blood-twin")({
  head: () => ({ meta: [{ title: "Digital Blood Twin · Sanjeevani X" }] }),
  component: () => (
    <SubPage
      tag="Digital Blood Twin"
      title={
        <>
          Your <span className="text-gradient-red">healthcare twin</span>
        </>
      }
      subtitle="An AI-generated profile that tracks every transfusion, predicts every need, and assigns dedicated donor coverage for life."
    >
      <div className="grid lg:grid-cols-3 gap-4">
        {[
          "Blood Group",
          "Medical History",
          "Donation Timeline",
          "Future Transfusion Schedule",
          "Assigned Donors",
          "Backup Coverage",
          "Risk Level",
          "AI Predictions",
          "Care Notes",
        ].map((c) => (
          <div key={c} className="glass rounded-2xl p-6 min-h-[160px]">
            <div className="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">{c}</div>
            <div className="font-display text-2xl text-gradient-red">●●●●</div>
          </div>
        ))}
      </div>
    </SubPage>
  ),
});
