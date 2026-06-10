import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { SubPage } from "@/components/SubPage";
import { DONORS, cooldownStatus, synthDonations, donorBadges } from "@/lib/bloodbridge";
import { ArrowLeft, MapPin, Award, Calendar, Activity } from "lucide-react";

export const Route = createFileRoute("/donor/$id")({
  head: () => ({ meta: [{ title: "Donor Profile · Sanjeevani X" }] }),
  component: DonorProfile,
});

function DonorProfile() {
  const { id } = useParams({ from: "/donor/$id" });
  const donor = DONORS.find((d) => d.donor_id === id);
  if (!donor) {
    return (
      <SubPage tag="404" title={<>Donor not found</>} subtitle="">
        <Link to="/donors" className="text-[#FF4D6D]">
          ← Back to directory
        </Link>
      </SubPage>
    );
  }
  const cd = cooldownStatus(donor);
  const donations = synthDonations(donor);
  const badges = donorBadges(donations);
  const cities = [donor.city, "Mumbai Metro", "Pune"].slice(0, Math.min(3, donations));

  return (
    <SubPage
      tag={`Donor #${donor.donor_id}`}
      title={
        <>
          {donor.donor_name} · <span className="text-gradient-red">{donor.blood_group}</span>
        </>
      }
      subtitle={`Blood Warrior from ${donor.city} — ${donations} lives touched.`}
    >
      <Link to="/donors" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to directory
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="text-xs text-white/40 uppercase mb-3 font-mono">Impact Card</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { i: Activity, label: "Donations", v: donations },
              { i: MapPin, label: "Cities Helped", v: cities.length },
              { i: Calendar, label: "Last Donation", v: donor.last_donation_date.slice(5) },
            ].map((s) => (
              <div key={s.label} className="bg-black/30 rounded-xl p-4 border border-white/5">
                <s.i className="w-5 h-5 text-[#FF4D6D] mb-2" />
                <div className="text-2xl font-display font-bold">{s.v}</div>
                <div className="text-[10px] uppercase text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="text-xs text-white/40 uppercase mb-3 font-mono">Status</div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-xs font-mono border ${
                cd.state === "available"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}
            >
              {cd.state === "available" ? "AVAILABLE TO DONATE" : `COOLDOWN · ${cd.daysLeft} days left`}
            </div>
            {cd.state === "cooldown" && (
              <div className="text-xs text-white/50 mt-2">Next eligible: {cd.nextEligible}</div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="text-xs text-white/40 uppercase mb-3 font-mono">Badge Wall</div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.name}
                className={`rounded-xl p-4 text-center border ${
                  b.earned
                    ? "bg-gradient-to-br from-[#FF4D6D]/20 to-[#E63946]/10 border-[#FF4D6D]/40"
                    : "bg-white/[0.02] border-white/5 opacity-40"
                }`}
              >
                <div className="text-3xl mb-1">{b.emoji}</div>
                <div className="text-xs font-medium">{b.name}</div>
                <div className="text-[9px] text-white/40 mt-0.5">{b.min}+ donations</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/50">
            <Award className="w-3 h-3 inline mr-1 text-[#FF4D6D]" />
            All contact routed through AI voice agent. Phone never shared.
          </div>
        </div>
      </div>
    </SubPage>
  );
}
