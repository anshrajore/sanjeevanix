import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Hero,
  MarqueeStrip,
  AISection,
  DirectCommSection,
  ProblemSolutionSection,
  ThalassemiaSection,
  CommandCenterPreview,
  ImpactSection,
  FinalCTA,
} from "@/components/sections";
import { CityRiskDashboard } from "@/components/CityRiskDashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sanjeevani X — AI Blood Intelligence Platform" },
      {
        name: "description",
        content:
          "India's first AI Blood Intelligence Platform. Voice AI, predictive analytics, and donor intelligence to help patients receive blood faster.",
      },
      { property: "og:title", content: "Sanjeevani X — AI Blood Intelligence Platform" },
      {
        property: "og:description",
        content: "The AI infrastructure behind blood accessibility and thalassemia care.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <AISection />
        <DirectCommSection />
        <CityRiskDashboard />
        <ProblemSolutionSection />
        <ThalassemiaSection />
        <CommandCenterPreview />
        <ImpactSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
