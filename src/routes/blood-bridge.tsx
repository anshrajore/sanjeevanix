import { createFileRoute } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";
import { Activity, Shield, Network, Database, TrendingUp, Volume2, Heart, Cpu } from "lucide-react";

export const Route = createFileRoute("/blood-bridge")({
  head: () => ({ meta: [{ title: "Blood Bridge AI · Sanjeevani X" }, { name: "description", content: "Enterprise architecture for AI-powered blood coordination." }] }),
  component: () => (
    <SubPage tag="Blood Bridge AI" title={<>Enterprise <span className="text-gradient-red">Blood Coordination</span></>} subtitle="From request to transfusion in under three minutes. Built on RAG memory, predictive scoring, and voice-native outreach.">
      <div className="grid lg:grid-cols-4 gap-4">
        {[
          { i: Activity, t: "Patient Request" },
          { i: Shield, t: "AI Validation" },
          { i: Network, t: "Matching Engine" },
          { i: Database, t: "Primary Donors" },
          { i: TrendingUp, t: "Backup Donors" },
          { i: Volume2, t: "Voice Outreach" },
          { i: Heart, t: "Acceptance" },
          { i: Cpu, t: "Impact Recorded" },
        ].map((s, i) => (
          <div key={s.t} className="glass rounded-2xl p-6">
            <div className="font-mono text-xs text-[#FF4D6D]">STEP {String(i + 1).padStart(2, "0")}</div>
            <s.i className="w-6 h-6 text-[#FF4D6D] my-3" />
            <div className="font-display font-semibold">{s.t}</div>
          </div>
        ))}
      </div>
    </SubPage>
  ),
});
