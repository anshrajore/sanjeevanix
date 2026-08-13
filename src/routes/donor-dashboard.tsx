import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SubPage } from "@/components/SubPage";
import { DonorTimeline } from "@/components/DonorTimeline";
import { KpiCounter } from "@/components/KpiCounter";
import { DONORS, donorBadges, synthDonations, cooldownStatus } from "@/lib/bloodbridge";
import { downloadICS, googleCalendarUrl, outlookCalendarUrl, mapsUrl } from "@/lib/calendar";
import { Award, Heart, TrendingUp, Calendar, Download, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/donor-dashboard")({
  head: () => ({ meta: [{ title: "Donor Dashboard · Sanjeevani X" }] }),
  component: DonorDashboard,
});

function DonorDashboard() {
  const donor = DONORS[0];
  const [available, setAvailable] = useState(donor.status === "active");
  const cd = cooldownStatus(donor);
  const donations = synthDonations(donor);
  const badges = donorBadges(donations);

  const apptDate = new Date(Date.now() + 1000 * 60 * 60 * 36);
  const ev = {
    title: `Sanjeevani · Blood Donation Appointment`,
    description: `Donate 1u ${donor.blood_group} at Lilavati Hospital. Patient: Aarav S. (Thalassemia). Coordinator: Priya.`,
    location: "Lilavati Hospital, Mumbai",
    start: apptDate,
    durationMinutes: 60,
  };

  return (
    <SubPage
      tag="Blood Warrior · Donor"
      title={
        <>
          Welcome, <span className="text-gradient-red">{donor.donor_name}</span>
        </>
      }
      subtitle={`Your donations save real lives. Here's your impact, eligibility and upcoming appointments.`}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCounter icon={Heart} label="Total Donations" value={donations} accent="#FF4D6D" />
        <KpiCounter icon={TrendingUp} label="Trust Score" value={donor.trust_score} suffix="/100" accent="#34D399" />
        <KpiCounter icon={Award} label="Response Rate" value={donor.response_rate} suffix="%" accent="#FBBF24" />
        <KpiCounter
          icon={Calendar}
          label="Eligibility"
          value={cd.state === "available" ? "Now" : `${cd.daysLeft}d`}
          accent={cd.state === "available" ? "#34D399" : "#FBBF24"}
          live
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EligibilityForm />

          <DonorTimeline donor={donor} />


          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Upcoming Appointment
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/60">Available for outreach</span>
                <button
                  onClick={() => setAvailable((a) => !a)}
                  className={`w-10 h-5 rounded-full transition relative ${
                    available ? "bg-[#34D399]" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${
                      available ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="font-display text-xl font-bold">
                  {apptDate.toLocaleString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-sm text-white/60 mt-1">Lilavati Hospital, Mumbai</div>
                <div className="text-xs text-white/40 mt-0.5">
                  Patient: Aarav S. (Thalassemia · {donor.blood_group})
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={googleCalendarUrl(ev)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs glass rounded-lg px-3 py-2 hover:bg-white/5 flex items-center gap-1.5 border border-white/10"
                >
                  <ExternalLink className="w-3 h-3" /> Google
                </a>
                <a
                  href={outlookCalendarUrl(ev)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs glass rounded-lg px-3 py-2 hover:bg-white/5 flex items-center gap-1.5 border border-white/10"
                >
                  <ExternalLink className="w-3 h-3" /> Outlook
                </a>
                <button
                  onClick={() => downloadICS("donation", ev)}
                  className="text-xs glass rounded-lg px-3 py-2 hover:bg-white/5 flex items-center gap-1.5 border border-white/10"
                >
                  <Download className="w-3 h-3" /> Apple .ics
                </button>
                <a
                  href={mapsUrl("Lilavati Hospital Mumbai")}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white rounded-lg px-3 py-2"
                >
                  Directions →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-4">
              Badges Earned
            </div>
            <div className="grid grid-cols-2 gap-2">
              {badges.map((b) => (
                <div
                  key={b.name}
                  className={`rounded-xl p-3 text-center border ${
                    b.earned
                      ? "bg-gradient-to-br from-[#FF4D6D]/10 to-[#FBBF24]/10 border-[#FBBF24]/30"
                      : "bg-white/[0.02] border-white/5 opacity-40"
                  }`}
                >
                  <div className="text-2xl">{b.emoji}</div>
                  <div className="text-[11px] font-medium mt-1">{b.name}</div>
                  <div className="text-[9px] text-white/40">{b.min}+ donations</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
              Recent Donations
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-xs">
                <div>
                  <div className="font-medium">Lilavati Hospital</div>
                  <div className="text-[10px] text-white/40">
                    {new Date(Date.now() - (i + 1) * 95 * 86400000).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-[#FF4D6D] font-mono">1u {donor.blood_group}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SubPage>
  );
}
