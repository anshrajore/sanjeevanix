import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Radio,
  Siren,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { dispatchEmergencyRequest } from "@/lib/emergency.functions";
import { BLOOD_GROUPS, CITIES } from "@/lib/donor-matching";
import { formatEta } from "@/lib/city-risk";

type DonorOutcome = {
  donorRef: string;
  name: string;
  maskedPhone: string | null;
  status: string;
  error: string | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  matchScore: number | null;
};

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  queued: "bg-white/5 text-white/50 border-white/10",
  skipped: "bg-[#FFD166]/15 text-[#FFD166] border-[#FFD166]/30",
  failed: "bg-[#E63946]/15 text-[#FF4D6D] border-[#E63946]/30",
};

export function EmergencyRequestDialog({
  open,
  onClose,
  defaultCity = "Mumbai",
  defaultGroup = "O-",
}: {
  open: boolean;
  onClose: () => void;
  defaultCity?: string;
  defaultGroup?: string;
}) {
  const { user, loading } = useAuth();
  const dispatch = useServerFn(dispatchEmergencyRequest);

  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState(defaultGroup);
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [city, setCity] = useState(defaultCity);
  const [hospital, setHospital] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof dispatch>[0]) => dispatch(payload),
  });

  if (!open) return null;

  const result = mutation.data as
    | {
        requestId: string;
        status: string;
        notified: number;
        poolSize: number;
        etaMinutes: number | null;
        radiusUsedKm: number;
        expanded: boolean;
        donors: DonorOutcome[];
      }
    | undefined;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-8">
      <div className="w-full max-w-2xl glass rounded-2xl border border-[#E63946]/30 p-6 my-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E63946]/20 border border-[#E63946]/40 px-3 py-1 text-[10px] uppercase tracking-wider text-[#FF4D6D]">
              <Siren className="w-3 h-3 animate-pulse" /> Emergency mode
            </div>
            <h2 className="font-display text-2xl font-bold mt-3">
              Notify the highest-priority donor pool
            </h2>
            <p className="text-sm text-white/55 mt-1">
              Sanjeevani AI ranks compatible donors by distance, trust and availability, then sends
              an instant WhatsApp alert to the top pool.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close emergency request"
            className="text-white/40 hover:text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking your session…
          </div>
        ) : !user ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/70">
              Emergency dispatch sends real messages to real donors, so it needs a verified account.
            </p>
            <Link
              to="/auth"
              search={{ next: "/request-blood" }}
              className="inline-flex items-center gap-2 mt-4 rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-4 py-2.5 text-sm font-medium"
            >
              <Lock className="w-4 h-4" /> Sign in to dispatch
            </Link>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Donors notified" value={`${result.notified}/${result.poolSize}`} />
              <Stat
                label="First donor ETA"
                value={result.etaMinutes ? formatEta(result.etaMinutes) : "—"}
              />
              <Stat label="Search radius" value={`${result.radiusUsedKm} km`} />
            </div>

            <div className="flex items-center gap-2 text-xs">
              {result.status === "notified" ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pool alerted — awaiting donor
                  confirmations
                </span>
              ) : result.status === "no_donors" ? (
                <span className="inline-flex items-center gap-1.5 text-[#FFD166]">
                  <AlertCircle className="w-3.5 h-3.5" /> No eligible donors matched. Widen the city
                  or blood group.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#FF4D6D]">
                  <AlertCircle className="w-3.5 h-3.5" /> Messages could not be delivered — check
                  the log below.
                </span>
              )}
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-white/40 px-3 py-2 border-b border-white/5">
                <div className="col-span-5">Donor</div>
                <div className="col-span-3">Distance / ETA</div>
                <div className="col-span-2">Score</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                {result.donors.map((d) => (
                  <div key={d.donorRef} className="grid grid-cols-12 items-center px-3 py-2.5 text-xs">
                    <div className="col-span-5">
                      <div className="text-white/85">{d.name}</div>
                      <div className="text-[10px] text-white/35 font-mono">{d.maskedPhone}</div>
                    </div>
                    <div className="col-span-3 text-white/60">
                      {d.distanceKm ?? "—"} km ·{" "}
                      {d.etaMinutes ? formatEta(d.etaMinutes) : "—"}
                    </div>
                    <div className="col-span-2 font-mono text-[#FF4D6D]">{d.matchScore ?? "—"}</div>
                    <div className="col-span-2 flex justify-end">
                      <span
                        title={d.error ?? undefined}
                        className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          STATUS_STYLE[d.status] ?? STATUS_STYLE.queued
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => mutation.reset()}
                className="text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2"
              >
                New emergency request
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs rounded-lg bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-3 py-2"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({
                data: {
                  patientName: patientName.trim(),
                  bloodGroup,
                  unitsNeeded,
                  city,
                  hospital: hospital.trim(),
                  contactPhone: contactPhone.trim(),
                  poolSize: 8,
                },
              } as Parameters<typeof dispatch>[0]);
            }}
            className="space-y-3"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Patient name">
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Blood group needed">
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className={inputCls}
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Units needed">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={unitsNeeded}
                  onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="City">
                <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls}>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hospital">
                <input
                  maxLength={120}
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Coordinator phone">
                <input
                  maxLength={20}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91…"
                  className={inputCls}
                />
              </Field>
            </div>

            {mutation.isError && (
              <p className="text-xs text-[#FF4D6D]">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Dispatch failed. Please retry."}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-white/35 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Top 8 compatible donors within 50 km, auto-expanding
                if needed.
              </p>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Radio className="w-4 h-4" />
                )}
                {mutation.isPending ? "Dispatching…" : "Dispatch emergency alert"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#FF4D6D]/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">{label}</div>
    </div>
  );
}
