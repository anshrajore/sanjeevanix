import { createFileRoute } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";
import { LiveRequestTracker } from "@/components/LiveRequestTracker";
import { KpiCounter } from "@/components/KpiCounter";
import { DONORS, REQUESTS, type BBDonor } from "@/lib/bloodbridge";
import { downloadICS, googleCalendarUrl, mapsUrl } from "@/lib/calendar";
import { Calendar, Hospital, Users, Heart, ExternalLink, Download } from "lucide-react";

export const Route = createFileRoute("/patient-dashboard")({
  head: () => ({ meta: [{ title: "Patient Dashboard · Sanjeevani X" }] }),
  component: PatientDashboard,
});

function PatientDashboard() {
  const req = REQUESTS.find((r) => r.status === "Open") ?? REQUESTS[0];
  const primary: BBDonor[] = req.assigned_donor_pool
    .map((id) => DONORS.find((d) => d.donor_id === id))
    .filter((d): d is BBDonor => !!d);
  const backup: BBDonor[] = req.backup_donor_pool
    .map((id) => DONORS.find((d) => d.donor_id === id))
    .filter((d): d is BBDonor => !!d);

  const appointmentDate = new Date(Date.now() + 1000 * 60 * 60 * 18);
  const ev = {
    title: `Blood Transfusion · ${req.patient_name}`,
    description: `${req.units_needed}u ${req.blood_group} at ${req.hospital}. Ward: Day Care, Bed 12. Coordinator: Priya (+91 98765 43210).`,
    location: `${req.hospital}, ${req.city}`,
    start: appointmentDate,
    durationMinutes: 90,
  };

  return (
    <SubPage
      tag="Patient · Thalassemia Care"
      title={
        <>
          Welcome, <span className="text-gradient-red">{req.patient_name}</span>
        </>
      }
      subtitle={`Your transfusion request is being orchestrated by Sanjeevani AI in real time.`}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCounter icon={Heart} label="Blood Group" value={req.blood_group} accent="#FF4D6D" live />
        <KpiCounter icon={Users} label="Primary Donors" value={primary.length} accent="#34D399" />
        <KpiCounter icon={Users} label="Backup Donors" value={backup.length} accent="#A78BFA" />
        <KpiCounter icon={Hospital} label="Urgency" value={`L${req.urgency}`} accent="#FBBF24" />
      </div>

      <div className="mb-6">
        <LiveRequestTracker request={req} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[#FBBF24]" />
            <div className="text-xs font-mono text-white/40 uppercase tracking-wider">
              Upcoming Transfusion
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="font-display text-2xl font-bold">
                {appointmentDate.toLocaleString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-sm text-white/60 mt-1">
                {req.hospital} · Day Care Ward, Bed 12
              </div>
              <div className="text-xs text-white/40 mt-0.5">
                Coordinator: Priya (+91 98765 43210)
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={googleCalendarUrl(ev)}
                target="_blank"
                rel="noreferrer"
                className="text-xs glass rounded-lg px-3 py-2 hover:bg-white/5 flex items-center gap-1.5 border border-white/10"
              >
                <ExternalLink className="w-3 h-3" /> Google Calendar
              </a>
              <button
                onClick={() => downloadICS("transfusion", ev)}
                className="text-xs glass rounded-lg px-3 py-2 hover:bg-white/5 flex items-center gap-1.5 border border-white/10"
              >
                <Download className="w-3 h-3" /> .ics file
              </button>
              <a
                href={mapsUrl(`${req.hospital} ${req.city}`)}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white rounded-lg px-3 py-2 flex items-center gap-1.5"
              >
                Directions →
              </a>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
            Assigned Pool · Live
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {primary.slice(0, 8).map((d, i) => (
              <div
                key={d.donor_id}
                className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-lg text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#34D399]/20 text-[#34D399] flex items-center justify-center font-mono text-[10px]">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {d.donor_name.split(" ")[0]} {d.donor_name.split(" ")[1]?.[0]}.
                  </div>
                  <div className="text-[10px] text-white/40">
                    {d.blood_group} · trust {d.trust_score}
                  </div>
                </div>
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{
                    background: i < 2 ? "#34D399" : i < 4 ? "#FBBF24" : "#6B7280",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SubPage>
  );
}
