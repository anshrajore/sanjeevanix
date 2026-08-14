import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, FileClock, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getEligibilityAudit } from "@/lib/eligibility.functions";
import { SEVERITY_LABEL, SEVERITY_STYLE, type RiskFlag } from "@/lib/eligibility-flags";

type AuditRow = {
  id: string;
  flags: unknown;
  eligible: boolean;
  score: number;
  deferral_reason: string | null;
  next_eligible_date: string | null;
  source: string;
  created_at: string;
};

function asFlags(value: unknown): RiskFlag[] {
  return Array.isArray(value) ? (value as RiskFlag[]) : [];
}

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Explains the donor's latest screening outcome flag-by-flag and exposes the
 * full append-only audit trail of every questionnaire they have submitted.
 */
export function EligibilityResultsSummary() {
  const { user } = useAuth();
  const fetchAudit = useServerFn(getEligibilityAudit);
  const [openId, setOpenId] = useState<string | null>(null);

  const audit = useQuery({
    queryKey: ["eligibility-audit", user?.id],
    queryFn: () => fetchAudit() as Promise<AuditRow[]>,
    enabled: Boolean(user),
  });

  if (!user) return null;

  if (audit.isLoading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your screening history…
      </div>
    );
  }

  const rows = audit.data ?? [];
  if (rows.length === 0) return null;

  const latest = rows[0];
  const flags = asFlags(latest.flags);
  const blocking = flags.filter((f) => f.severity === "blocking");
  const temporary = flags.filter((f) => f.severity === "temporary");

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-mono text-white/40 uppercase tracking-wider">
            Screening results & risk flags
          </div>
          <div className="text-[11px] text-white/35 mt-1">Last screened {dateFmt(latest.created_at)}</div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-wider ${
            latest.eligible
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-[#E63946]/15 text-[#FF4D6D] border-[#E63946]/30"
          }`}
        >
          {latest.eligible ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          {latest.eligible ? "Eligible" : "Deferred"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Readiness score" value={`${latest.score}/100`} />
        <Stat label="Blocking flags" value={`${blocking.length}`} />
        <Stat label="Temporary flags" value={`${temporary.length}`} />
      </div>

      {latest.deferral_reason && (
        <p className="text-sm text-white/70 mt-4">{latest.deferral_reason}</p>
      )}
      {latest.next_eligible_date && (
        <p className="text-xs text-white/45 mt-1">
          Next eligible from{" "}
          {new Date(latest.next_eligible_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      )}

      <div className="mt-5 space-y-2">
        {flags.length === 0 ? (
          <p className="text-xs text-white/50">
            No risk flags were raised — you cleared every safety check in this screening.
          </p>
        ) : (
          flags.map((f) => (
            <div key={f.code} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-white/85">{f.label}</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${SEVERITY_STYLE[f.severity]}`}
                >
                  {SEVERITY_LABEL[f.severity]}
                </span>
              </div>
              <p className="text-xs text-white/55 mt-1.5">{f.explanation}</p>
              <p className="text-xs text-[#FF9AAE] mt-1">→ {f.action}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/40 mb-2">
          <FileClock className="w-3 h-3" /> Audit trail · {rows.length} submission
          {rows.length === 1 ? "" : "s"}
        </div>
        <div className="divide-y divide-white/5">
          {rows.map((r) => {
            const rFlags = asFlags(r.flags);
            const isOpen = openId === r.id;
            return (
              <div key={r.id} className="py-2">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  className="w-full flex items-center justify-between gap-3 text-left text-xs"
                >
                  <span className="text-white/70">{dateFmt(r.created_at)}</span>
                  <span className="flex items-center gap-2 text-white/45">
                    <span className="font-mono">{r.score}/100</span>
                    <span className={r.eligible ? "text-emerald-400" : "text-[#FF4D6D]"}>
                      {r.eligible ? "eligible" : "deferred"}
                    </span>
                    <span className="text-white/30">{rFlags.length} flags</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                {isOpen && (
                  <ul className="mt-2 space-y-1 pl-1">
                    <li className="text-[11px] text-white/35">Source: {r.source}</li>
                    {rFlags.map((f) => (
                      <li key={f.code} className="text-[11px] text-white/55 flex gap-2">
                        <span className="text-[#FF4D6D]">•</span>
                        <span>
                          <span className="text-white/75">{f.label}</span> — {f.explanation}
                        </span>
                      </li>
                    ))}
                    {rFlags.length === 0 && (
                      <li className="text-[11px] text-white/45">No flags recorded.</li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
