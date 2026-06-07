import { createFileRoute } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";
import { ImpactSection } from "@/components/sections";

export const Route = createFileRoute("/impact")({
  head: () => ({ meta: [{ title: "National Impact · Sanjeevani X" }] }),
  component: () => (
    <SubPage
      tag="National Impact"
      title={
        <>
          Across <span className="text-gradient-red">18 states.</span>
        </>
      }
      subtitle="Live statistics from the Sanjeevani X network."
    >
      <ImpactSection />
    </SubPage>
  ),
});
