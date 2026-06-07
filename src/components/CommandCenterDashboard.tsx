import { useEffect, useMemo, useState } from "react";
import { Activity, MapPin, Radio, Users } from "lucide-react";
import { DonorMap, type MapDonorPin } from "@/components/DonorMap";
import {
  getActivePatientRequests,
  getPatientRequests,
  subscribePatientRequests,
  toMapPatientPins,
} from "@/lib/patient-requests";
import { HOSPITALS, getDonorsNearPoint } from "@/lib/donor-matching";
import { getCityCenter } from "@/lib/geo";

export function CommandCenterDashboard() {
  const [requests, setRequests] = useState(getPatientRequests);
  const [city, setCity] = useState("Mumbai");
  const [showHospitals, setShowHospitals] = useState(true);
  const [showDonors, setShowDonors] = useState(true);

  useEffect(() => subscribePatientRequests(() => setRequests(getPatientRequests())), []);

  const active = getActivePatientRequests();
  const center = getCityCenter(city);
  const patients = toMapPatientPins(
    city === "All" ? requests : requests.filter((r) => r.city === city),
  );

  const donorPins: MapDonorPin[] = useMemo(() => {
    if (!showDonors) return [];
    return getDonorsNearPoint(center, 30)
      .slice(0, 40)
      .map((d) => ({
        id: d.donor_id,
        name: d.donor_name,
        bloodGroup: d.blood_group,
        lat: d.latitude,
        lng: d.longitude,
        distanceKm: 0,
        status: "available" as const,
      }));
  }, [center, showDonors]);

  const hospitals = showHospitals
    ? HOSPITALS.filter((h) => city === "All" || h.city === city).map((h) => ({
        id: h.hospital_id,
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        city: h.city,
        stock: h["O+"] + h["A+"] + h["B+"],
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", "Mumbai", "Pune", "Bengaluru", "Chennai", "Delhi", "Hyderabad"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              className={`px-3 py-1.5 rounded-lg text-sm ${city === c ? "bg-[#E63946] text-white" : "glass text-white/70"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-3 text-xs">
          <label className="flex items-center gap-2 text-white/60">
            <input
              type="checkbox"
              checked={showDonors}
              onChange={(e) => setShowDonors(e.target.checked)}
            />
            Donors
          </label>
          <label className="flex items-center gap-2 text-white/60">
            <input
              type="checkbox"
              checked={showHospitals}
              onChange={(e) => setShowHospitals(e.target.checked)}
            />
            Hospitals
          </label>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DonorMap
            center={center}
            zoom={city === "All" ? 5 : 11}
            origin={center}
            donors={donorPins}
            patients={patients}
            hospitals={hospitals}
            height="480px"
          />
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF4D6D]" /> Patient
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Donor
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Hospital
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h4 className="font-display font-semibold flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-[#FF4D6D] animate-pulse" /> Active requests
            </h4>
            {active.length === 0 ? (
              <p className="text-sm text-white/40">No active patient requests yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {active.map((r) => (
                  <div
                    key={r.request_id}
                    className="bg-black/30 rounded-lg p-3 text-sm border border-white/5"
                  >
                    <div className="font-medium">{r.patient_name}</div>
                    <div className="text-xs text-white/50 mt-1">
                      {r.blood_group} · {r.urgency} · {r.city}
                    </div>
                    <div className="text-xs text-white/40">{r.hospital}</div>
                    <div className="text-[10px] font-mono text-[#FF4D6D] mt-1">{r.request_id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <h4 className="font-display font-semibold flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#FF4D6D]" /> Network stats
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Total requests</span>
                <span className="font-mono">{requests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Active</span>
                <span className="font-mono text-orange-300">{active.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Donors on map</span>
                <span className="font-mono">{donorPins.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Hospitals</span>
                <span className="font-mono">{hospitals.length}</span>
              </div>
            </div>
          </div>

          <div className="glass-red rounded-2xl p-5">
            <h4 className="font-display font-semibold flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" /> Quick actions
            </h4>
            <p className="text-xs text-white/50 mb-3">
              Submit a blood request to see patient pins appear on the map in real time.
            </p>
            <a
              href="/request-blood"
              className="inline-flex items-center gap-2 text-sm bg-[#E63946] px-4 py-2 rounded-lg"
            >
              <MapPin className="w-4 h-4" /> New request
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
