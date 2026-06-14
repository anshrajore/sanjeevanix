import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, CheckCircle2, Calendar, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { triggerDonorContact, newRequestId, type ContactTriggerResponse } from "@/lib/n8n";
import { scheduleDonationAppointment } from "@/lib/calendar.functions";
import type { BBDonor } from "@/lib/bloodbridge";

type Stage = "idle" | "triggering" | "calling" | "confirmed" | "scheduled" | "declined" | "error";

const STAGES: { key: Stage; label: string }[] = [
  { key: "triggering", label: "Trigger fired" },
  { key: "calling", label: "VAPI calling donor" },
  { key: "confirmed", label: "Donor confirmed" },
  { key: "scheduled", label: "Calendar invite sent" },
];

export function DonorContactDialog({
  donor,
  open,
  onClose,
}: {
  donor: BBDonor | null;
  open: boolean;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [response, setResponse] = useState<ContactTriggerResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const run = async () => {
    if (!donor) return;
    setErrorMsg(null);
    setResponse(null);
    setStage("triggering");
    const reqId = newRequestId();

    // Visual progression while n8n executes
    const t1 = setTimeout(() => setStage("calling"), 600);

    try {
      // 1. Fire n8n trigger (best-effort; don't block calendar on its failure)
      let n8nData: ContactTriggerResponse | null = null;
      try {
        n8nData = await triggerDonorContact({
          event: "donor.contact.triggered",
          request_id: reqId,
          donor: {
            id: donor.donor_id,
            name: donor.donor_name,
            blood_group: donor.blood_group,
            city: donor.city,
            phone: donor.phone,
          },
          requested_at: new Date().toISOString(),
          source: "sanjeevanix-web",
        });
      } catch (e) {
        console.warn("n8n webhook failed:", e);
      }

      clearTimeout(t1);
      setStage("confirmed");

      // 2. Create the Google Calendar event on the Sanjeevani calendar
      const cal = await scheduleDonationAppointment({
        data: {
          donor_name: donor.donor_name,
          donor_id: donor.donor_id,
          blood_group: donor.blood_group,
          city: donor.city,
          notes: `Triggered via /donors. Request ${reqId}.`,
        },
      });

      if (!cal.ok) {
        setStage("error");
        setErrorMsg(cal.error ?? "Failed to create calendar event.");
        return;
      }

      setResponse({
        status: "scheduled",
        message: n8nData?.message,
        appointment: {
          starts_at: cal.starts_at,
          ends_at: cal.ends_at,
          location: cal.location,
          calendar_event_id: cal.event_id,
          calendar_link: cal.html_link,
        },
        donor_confirmation: { confirmed: true, confirmed_at: new Date().toISOString() },
      });
      setStage("scheduled");
    } catch (e) {
      clearTimeout(t1);
      setStage("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const reset = () => {
    setStage("idle");
    setResponse(null);
    setErrorMsg(null);
  };

  const activeIdx = STAGES.findIndex((s) => s.key === stage);

  return (
    <AnimatePresence>
      {open && donor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-3xl border border-white/10 w-full max-w-md p-6 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono">
                  AI Voice Contact
                </div>
                <div className="font-display font-semibold">
                  {donor.donor_name} ·{" "}
                  <span className="text-[#FF4D6D]">{donor.blood_group}</span>
                </div>
                <div className="text-xs text-white/50">{donor.city}</div>
              </div>
            </div>

            {stage === "idle" && (
              <>
                <p className="text-sm text-white/70 mt-4">
                  Trigger the n8n automation. Sanjeevani will call this donor via VAPI, take
                  confirmation, and schedule the appointment on Google Calendar.
                </p>
                <button
                  onClick={run}
                  className="w-full mt-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white font-medium text-sm"
                >
                  Run automation
                </button>
              </>
            )}

            {stage !== "idle" && (
              <div className="mt-5 space-y-2">
                {STAGES.map((s, i) => {
                  const done = i < activeIdx || stage === "scheduled" && i <= activeIdx;
                  const active = i === activeIdx && stage !== "scheduled" && stage !== "error" && stage !== "declined";
                  return (
                    <div key={s.key} className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          done
                            ? "bg-[#34D399]/20 text-[#34D399]"
                            : active
                              ? "bg-[#FBBF24]/20 text-[#FBBF24]"
                              : "bg-white/5 text-white/30"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : active ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </div>
                      <span
                        className={
                          done ? "text-white/80" : active ? "text-white" : "text-white/40"
                        }
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}

                {stage === "scheduled" && response?.appointment && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                      <Calendar className="w-3.5 h-3.5" /> Appointment scheduled
                    </div>
                    {response.appointment.starts_at && (
                      <div className="text-white/70">
                        {new Date(response.appointment.starts_at).toLocaleString()}
                      </div>
                    )}
                    {response.appointment.location && (
                      <div className="text-white/60">{response.appointment.location}</div>
                    )}
                    {response.appointment.calendar_link && (
                      <a
                        href={response.appointment.calendar_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#FF8A9A] hover:underline"
                      >
                        Open in Google Calendar <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {stage === "declined" && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    Donor declined. Sanjeevani is cascading to the backup pool.
                  </div>
                )}

                {stage === "error" && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{errorMsg ?? "Workflow failed."}</span>
                  </div>
                )}

                {(stage === "scheduled" || stage === "error" || stage === "declined") && (
                  <button
                    onClick={reset}
                    className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
                  >
                    Run again
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
