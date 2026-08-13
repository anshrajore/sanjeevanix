import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, ClipboardList, Loader2, Lock, ShieldCheck } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getLatestEligibility, saveEligibility } from "@/lib/eligibility.functions";
import { EMPTY_ANSWERS, evaluateEligibility, type EligibilityAnswers } from "@/lib/eligibility";
import { BLOOD_GROUPS, CITIES } from "@/lib/donor-matching";

const HEALTH_QUESTIONS: Array<{ key: keyof EligibilityAnswers; label: string }> = [
  { key: "pregnant_or_nursing", label: "Currently pregnant or nursing" },
  { key: "chronic_illness", label: "Heart, kidney, liver, cancer or uncontrolled diabetes history" },
  { key: "on_blood_thinners", label: "Taking blood-thinning medication" },
  { key: "recent_surgery_or_transfusion", label: "Surgery or transfusion in the last 6 months" },
  { key: "recent_tattoo_or_piercing", label: "Tattoo or piercing in the last 6 months" },
  { key: "recent_infection_or_antibiotics", label: "Recent infection or antibiotic course" },
  { key: "alcohol_last_24h", label: "Alcohol in the last 24 hours" },
  { key: "slept_less_than_5h", label: "Slept less than 5 hours last night" },
];

export function EligibilityForm() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const fetchLatest = useServerFn(getLatestEligibility);
  const save = useServerFn(saveEligibility);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<EligibilityAnswers>(EMPTY_ANSWERS);
  const [submitted, setSubmitted] = useState(false);

  const latest = useQuery({
    queryKey: ["eligibility", user?.id],
    queryFn: () => fetchLatest(),
    enabled: Boolean(user),
  });

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof save>[0]) => save(payload),
    onSuccess: () => {
      setSubmitted(true);
      void queryClient.invalidateQueries({ queryKey: ["eligibility", user?.id] });
    },
  });

  const result = useMemo(() => evaluateEligibility(answers), [answers]);

  const set = <K extends keyof EligibilityAnswers>(key: K, value: EligibilityAnswers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your screening…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
          <ClipboardList className="w-3.5 h-3.5" /> Become a donor
        </div>
        <h3 className="font-display text-xl font-bold">Health & eligibility screening</h3>
        <p className="text-sm text-white/55 mt-2 max-w-md">
          Answer 12 quick questions to find out if you can donate today. Sign in first so your
          results are saved privately to your donor profile.
        </p>
        <Link
          to="/auth"
          search={{ next: "/donor-dashboard" }}
          className="inline-flex items-center gap-2 mt-4 rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-4 py-2.5 text-sm font-medium"
        >
          <Lock className="w-4 h-4" /> Sign in to start screening
        </Link>
      </div>
    );
  }

  const saved = latest.data;
  if (saved && !submitted) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider">
            Eligibility screening
          </div>
          <span
            className={`text-[10px] px-2 py-1 rounded-full border uppercase tracking-wider ${
              saved.eligible
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-[#E63946]/15 text-[#FF4D6D] border-[#E63946]/30"
            }`}
          >
            {saved.eligible ? "Eligible" : "Deferred"}
          </span>
        </div>
        <div className="font-display text-3xl font-bold">{saved.score}/100</div>
        <div className="text-xs text-white/40 mt-1">
          Readiness score · screened{" "}
          {new Date(saved.created_at as string).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
        {saved.deferral_reason && (
          <p className="text-sm text-white/70 mt-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#FF4D6D] mt-0.5 shrink-0" />
            {saved.deferral_reason}
          </p>
        )}
        {saved.next_eligible_date && (
          <p className="text-xs text-white/45 mt-2">
            You can donate again from{" "}
            {new Date(saved.next_eligible_date as string).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setStep(0);
            setAnswers(EMPTY_ANSWERS);
            queryClient.setQueryData(["eligibility", user.id], null);
          }}
          className="mt-5 text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 transition"
        >
          Re-take screening
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2">
          {result.eligible ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#FF4D6D]" />
          )}
          <h3 className="font-display text-xl font-bold">
            {result.eligible ? "You're eligible to donate" : "You're temporarily deferred"}
          </h3>
        </div>
        <div className="font-display text-4xl font-bold mt-4">{result.score}/100</div>
        <div className="text-xs text-white/40">Donation readiness score</div>
        {result.deferralReason && (
          <p className="text-sm text-white/70 mt-3">{result.deferralReason}</p>
        )}
        {result.nextEligibleDate && (
          <p className="text-xs text-white/45 mt-1">
            Next eligible:{" "}
            {new Date(result.nextEligibleDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        <ul className="mt-4 space-y-1.5">
          {result.advisories.map((a) => (
            <li key={a} className="text-xs text-white/60 flex gap-2">
              <span className="text-[#FF4D6D]">•</span> {a}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-white/35 mt-4 flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
          Saved to your donor profile. This screening is guidance, not a medical diagnosis — the
          blood bank makes the final call.
        </p>
      </div>
    );
  }

  const canContinue =
    step === 0
      ? answers.full_name.trim().length > 1 &&
        answers.age > 0 &&
        answers.weight_kg > 0 &&
        answers.blood_group !== "" &&
        answers.city !== ""
      : step === 1
        ? true
        : answers.consent;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs font-mono text-white/40 uppercase tracking-wider">
          Donor screening · Step {step + 1} of 3
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 w-8 rounded-full ${i <= step ? "bg-[#FF4D6D]" : "bg-white/10"}`}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name">
            <input
              value={answers.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              maxLength={80}
              className={inputCls}
            />
          </Field>
          <Field label="Phone (WhatsApp)">
            <input
              value={answers.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={20}
              placeholder="+91…"
              className={inputCls}
            />
          </Field>
          <Field label="Age (years)">
            <input
              type="number"
              min={0}
              max={120}
              value={answers.age || ""}
              onChange={(e) => set("age", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Weight (kg)">
            <input
              type="number"
              min={0}
              max={400}
              value={answers.weight_kg || ""}
              onChange={(e) => set("weight_kg", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Hemoglobin (g/dL, optional)">
            <input
              type="number"
              step="0.1"
              min={0}
              max={30}
              value={answers.hemoglobin ?? ""}
              onChange={(e) =>
                set("hemoglobin", e.target.value === "" ? null : Number(e.target.value))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Blood group">
            <select
              value={answers.blood_group}
              onChange={(e) => set("blood_group", e.target.value)}
              className={inputCls}
            >
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <select
              value={answers.city}
              onChange={(e) => set("city", e.target.value)}
              className={inputCls}
            >
              <option value="">Select</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Days since last donation">
            <input
              type="number"
              min={0}
              value={answers.last_donation_days === 999 ? "" : answers.last_donation_days}
              placeholder="Never donated"
              onChange={(e) =>
                set("last_donation_days", e.target.value === "" ? 999 : Number(e.target.value))
              }
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-2">
          {HEALTH_QUESTIONS.map((q) => (
            <label
              key={q.key}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5 cursor-pointer hover:bg-white/[0.06]"
            >
              <span className="text-sm text-white/75">{q.label}</span>
              <input
                type="checkbox"
                checked={Boolean(answers[q.key])}
                onChange={(e) => set(q.key, e.target.checked as never)}
                className="w-4 h-4 accent-[#FF4D6D]"
              />
            </label>
          ))}
          <p className="text-[11px] text-white/35 pt-1">
            Tick anything that applies to you. Nothing ticked means no known deferral.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-sm">
            <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2">
              Preliminary outcome
            </div>
            <div className="font-display text-2xl font-bold">
              {result.eligible ? "Likely eligible" : "Likely deferred"} · {result.score}/100
            </div>
            {result.deferralReason && (
              <p className="text-xs text-white/60 mt-2">{result.deferralReason}</p>
            )}
          </div>
          <label className="flex items-start gap-3 text-sm text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={answers.consent}
              onChange={(e) => set("consent", e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#FF4D6D]"
            />
            I confirm these answers are accurate and consent to Sanjeevani X storing them and
            contacting me about matching blood requests.
          </label>
          {mutation.isError && (
            <p className="text-xs text-[#FF4D6D]">
              {mutation.error instanceof Error ? mutation.error.message : "Could not save."}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-6">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="text-xs text-white/45 hover:text-white/75 disabled:opacity-30"
        >
          ← Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-5 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            disabled={!answers.consent || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                data: {
                  answers,
                  eligible: result.eligible,
                  score: result.score,
                  deferralReason: result.deferralReason,
                  nextEligibleDate: result.nextEligibleDate,
                },
              } as Parameters<typeof save>[0])
            }
            className="rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-5 py-2.5 text-sm font-medium disabled:opacity-40 inline-flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit screening
          </button>
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
