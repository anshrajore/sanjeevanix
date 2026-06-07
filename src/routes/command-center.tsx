import { createFileRoute } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";
import { CommandCenterPreview } from "@/components/sections";

export const Route = createFileRoute("/command-center")({
  head: () => ({ meta: [{ title: "Command Center · Sanjeevani X" }] }),
  component: () => (
    <SubPage
      tag="Command Center"
      title={
        <>
          Mission control for <span className="text-gradient-red">lives</span>
        </>
      }
      subtitle="Every active request. Every AI call. Every coordination event — live."
    >
      <CommandCenterPreview />
    </SubPage>
  ),
});
