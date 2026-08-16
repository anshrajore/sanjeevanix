import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  Droplet,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldQuestion,
} from "lucide-react";

import { SubPage } from "@/components/SubPage";
import { HospitalMap, type HospitalPin } from "@/components/HospitalMap";
import { PhoneOtpField } from "@/components/PhoneOtpField";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hospital-network")({
  head: () => ({
    meta: [
      { title: "Hospital Network · Sanjeevani X" },
      {
        name: "description",
        content:
          "Search verified hospitals and blood banks by city, state and country with switchboard numbers, emergency lines and OTP-verified contact hand-off.",
      },
      { property: "og:title", content: "Hospital Network · Sanjeevani X" },
      {
        property: "og:description",
        content: "Verified hospital directory with emergency phone lines and live map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HospitalNetwork,
});

const FIELDS =
  "id, name, address, city, state, country, latitude, longitude, phone, emergency_phone, capabilities, blood_bank_available, verification_status, verified_at";

function HospitalNetwork() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [state, setState] = useState("all");
  const [city, setCity] = useState("all");
  const [bloodBankOnly, setBloodBankOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hospitals = useQuery({
    queryKey: ["hospital-directory"],
    queryFn: async (): Promise<HospitalPin[]> => {
      const { data, error } = await supabase
        .from("hospital_directory")
        .select(FIELDS)
        .eq("active", true)
        .order("name");
      if (error) throw new Error(error.message);
      return (data ?? []).map((h) => ({
        ...h,
        latitude: Number(h.latitude),
        longitude: Number(h.longitude),
        capabilities: h.capabilities ?? [],
      })) as HospitalPin[];
    },
  });

  const all = hospitals.data ?? [];

  const countries = useMemo(() => unique(all.map((h) => h.country)), [all]);
  const states = useMemo(
    () => unique(all.filter((h) => country === "all" || h.country === country).map((h) => h.state)),
    [all, country],
  );
  const cities = useMemo(
    () =>
      unique(
        all
          .filter((h) => country === "all" || h.country === country)
          .filter((h) => state === "all" || h.state === state)
          .map((h) => h.city),
      ),
    [all, country, state],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((h) => {
      if (country !== "all" && h.country !== country) return false;
      if (state !== "all" && h.state !== state) return false;
      if (city !== "all" && h.city !== city) return false;
      if (bloodBankOnly && !h.blood_bank_available) return false;
      if (!q) return true;
      return [h.name, h.city, h.state, h.country, h.address ?? "", h.capabilities.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [all, bloodBankOnly, city, country, query, state]);

  const selected = filtered.find((h) => h.id === selectedId) ?? null;

  return (
    <SubPage
      tag="National network"
      title={
        <>
          Hospital <span className="text-gradient-red">Network</span>
        </>
      }
      subtitle="Verified hospitals and blood banks with switchboard and emergency lines. Verified partners are operationally confirmed; unverified listings are shown for discovery only."
    >
      <div className="space-y-5">
        <div className="glass rounded-2xl p-4 grid gap-2 md:grid-cols-5">
          <label className="md:col-span-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hospital, city or capability…"
              className="w-full bg-transparent py-2.5 text-xs outline-none"
            />
          </label>
          <Select value={country} onChange={setCountry} options={countries} label="All countries" />
          <Select value={state} onChange={setState} options={states} label="All states" />
          <Select value={city} onChange={setCity} options={cities} label="All cities" />
          <label className="md:col-span-5 flex items-center gap-2 text-[11px] text-white/60">
            <input
              type="checkbox"
              checked={bloodBankOnly}
              onChange={(e) => setBloodBankOnly(e.target.checked)}
            />
            Only hospitals with an on-site blood bank
            <span className="ml-auto font-mono text-white/40">
              {filtered.length} of {all.length} facilities
            </span>
          </label>
        </div>

        {hospitals.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading hospital directory…
          </div>
        ) : hospitals.isError ? (
          <p className="text-xs text-[#FF4D6D]">
            {hospitals.error instanceof Error
              ? hospitals.error.message
              : "Could not load the directory."}
          </p>
        ) : (
          <div className="grid lg:grid-cols-[1.35fr_1fr] gap-5">
            <HospitalMap
              hospitals={filtered}
              selectedId={selectedId}
              onSelect={(h) => setSelectedId(h.id)}
            />

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                {filtered.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedId(h.id === selectedId ? null : h.id)}
                    className={`w-full text-left px-3 py-2.5 text-xs hover:bg-white/[0.04] ${
                      selectedId === h.id ? "bg-white/[0.06]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-white/85">
                      <Building2 className="w-3.5 h-3.5 text-white/35" />
                      {h.name}
                      {h.verification_status === "verified" ? (
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ShieldQuestion className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      {h.city}, {h.state} · {h.country}
                      {h.blood_bank_available ? " · blood bank" : ""}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-3 py-4 text-xs text-white/40">
                    No facility matches these filters.
                  </p>
                )}
              </div>

              {selected ? (
                <div className="glass rounded-2xl p-4 space-y-3">
                  <div>
                    <div className="font-display text-base font-bold flex items-center gap-2">
                      {selected.name}
                      {selected.verification_status === "verified" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 rounded-full px-2 py-0.5">
                          <BadgeCheck className="w-3 h-3" /> Verified partner
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 mt-1 flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      {selected.address ? `${selected.address}, ` : ""}
                      {selected.city}, {selected.state}, {selected.country}
                    </p>
                  </div>

                  <div className="grid gap-1.5 text-[11px] text-white/70">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-white/35" /> Switchboard:{" "}
                      {selected.phone ?? "not published"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#FF4D6D]" /> Emergency:{" "}
                      {selected.emergency_phone ?? "use switchboard"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Droplet className="w-3 h-3 text-[#FF4D6D]" />{" "}
                      {selected.blood_bank_available
                        ? "On-site blood bank"
                        : "No on-site blood bank"}
                      {selected.capabilities.length > 0 &&
                        ` · ${selected.capabilities.join(", ")}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
                    >
                      <Navigation className="w-3 h-3" /> Directions
                    </a>
                    <Link
                      to="/request-blood"
                      className="inline-flex items-center gap-1.5 text-[11px] rounded-lg bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-2.5 py-1.5"
                    >
                      <Droplet className="w-3 h-3" /> Raise a request here
                    </Link>
                  </div>

                  <div className="pt-1">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                      Optional OTP verification of this contact line
                    </p>
                    {user ? (
                      selected.emergency_phone || selected.phone ? (
                        <PhoneOtpField
                          label="Hospital contact"
                          purpose="hospital"
                          phone={(selected.emergency_phone ?? selected.phone) as string}
                          onVerified={() => undefined}
                        />
                      ) : (
                        <p className="text-[11px] text-white/45">
                          No published number to verify for this facility.
                        </p>
                      )
                    ) : (
                      <Link
                        to="/auth"
                        search={{ next: "/hospital-network" }}
                        className="text-[11px] text-[#FF4D6D] hover:underline"
                      >
                        Sign in to send a verification code to this hospital line
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/40 px-1">
                  Select a facility on the map or in the list to see phone lines, capabilities and
                  verification options.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </SubPage>
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-xs"
    >
      <option value="all">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
