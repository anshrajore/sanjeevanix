import { createFileRoute } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";

export const Route = createFileRoute("/stories")({
  head: () => ({ meta: [{ title: "Success Stories · Sanjeevani X" }] }),
  component: () => (
    <SubPage tag="Stories" title={<>Real <span className="text-gradient-red">Blood Warriors.</span></>} subtitle="Patients, donors, volunteers, hospitals — the people behind the network.">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl overflow-hidden group">
            <div className="aspect-[4/3] bg-gradient-to-br from-[#E63946]/40 to-black relative">
              <div className="absolute inset-0 dot-bg opacity-30" />
              <div className="absolute bottom-3 left-3 text-xs glass px-2 py-1 rounded">{["Patient", "Donor", "Volunteer", "Hospital", "Family", "NGO"][i]}</div>
            </div>
            <div className="p-5">
              <h3 className="font-display font-semibold">Story #{i + 1}</h3>
              <p className="text-sm text-white/60 mt-2 line-clamp-2">A life saved through coordinated intelligence — the Sanjeevani X way.</p>
            </div>
          </div>
        ))}
      </div>
    </SubPage>
  ),
});
