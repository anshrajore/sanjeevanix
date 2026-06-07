import { createFileRoute } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";
import { CommandCenterDashboard } from "@/components/CommandCenterDashboard";

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
      subtitle="Live map of patients, donors, and hospitals — every active request in real time."
    >
      <CommandCenterDashboard />
    </SubPage>
  ),
});
