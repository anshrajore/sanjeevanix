import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Droplet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { submitBloodRequest, type BloodRequestInput } from "@/lib/blood-request";

type FormState = BloodRequestInput;

const initial: FormState = {
  patient_name: "",
  blood_group: "O+",
  units_needed: "1",
  city: "",
  hospital: "",
  urgency: "High",
  status: "Open",
  patient_type: "Thalassemia",
  hospital_contact: "",
  patient_trust_score: "80",
  required_before: "",
  assigned_donor_pool: "",
  backup_donor_pool: "",
  request_source: "Website",
};

export const Route = createFileRoute("/request-blood")({
  head: () => ({
    meta: [
      { title: "Request Blood · Sanjeevani X" },
      { name: "description", content: "Submit a blood request to the Sanjeevani X AI coordination platform." },
    ],
  }),
  component: RequestBloodPage,
});

function RequestBloodPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; id?: string } | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const data = await submitBloodRequest(form);
      if (data.ok) {
        setResult({ ok: true, msg: "Request saved to Google Sheet.", id: data.request_id });
        setForm(initial);
      } else {
        setResult({ ok: false, msg: data.error });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setResult({ ok: false, msg });
    } finally {
      setSubmitting(false);
    }
  };

  const field = "mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF4D6D]/60 focus:bg-white/[0.07] transition";
  const label = "text-[11px] uppercase tracking-[0.14em] text-white/40 font-medium";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass-red rounded-full px-4 py-1.5 mb-5">
              <Droplet className="w-3.5 h-3.5 text-[#FF4D6D]" />
              <span className="text-xs uppercase tracking-[0.2em] text-[#FF8A9A]">Emergency Intake</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
              Submit a <span className="text-gradient-red">Blood Request</span>
            </h1>
            <p className="mt-4 text-white/60 max-w-2xl mx-auto">
              Sanjeevani's AI will validate the request, score donor matches, and dispatch voice outreach in under three minutes.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-10 grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <div className="font-mono text-xs text-[#FF4D6D] mb-1">01 · PATIENT</div>
              <div className="h-px bg-white/10" />
            </div>

            <div>
              <label className={label}>Patient Name</label>
              <input required className={field} value={form.patient_name} onChange={(e) => update("patient_name", e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className={label}>Patient Type</label>
              <select className={field} value={form.patient_type} onChange={(e) => update("patient_type", e.target.value)}>
                {["Thalassemia", "Trauma", "Surgery", "Cancer", "Pregnancy", "Other"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className={label}>Blood Group</label>
              <select className={field} value={form.blood_group} onChange={(e) => update("blood_group", e.target.value)}>
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Units Needed</label>
              <input type="number" min={1} max={20} required className={field} value={form.units_needed} onChange={(e) => update("units_needed", e.target.value)} />
            </div>

            <div className="md:col-span-2 mt-4">
              <div className="font-mono text-xs text-[#FF4D6D] mb-1">02 · LOCATION</div>
              <div className="h-px bg-white/10" />
            </div>

            <div>
              <label className={label}>City</label>
              <input required className={field} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <label className={label}>Hospital</label>
              <input required className={field} value={form.hospital} onChange={(e) => update("hospital", e.target.value)} placeholder="Hospital name" />
            </div>
            <div>
              <label className={label}>Hospital Contact</label>
              <input required className={field} value={form.hospital_contact} onChange={(e) => update("hospital_contact", e.target.value)} placeholder="+91…" />
            </div>
            <div>
              <label className={label}>Required Before</label>
              <input type="datetime-local" required className={field} value={form.required_before} onChange={(e) => update("required_before", e.target.value)} />
            </div>

            <div className="md:col-span-2 mt-4">
              <div className="font-mono text-xs text-[#FF4D6D] mb-1">03 · TRIAGE</div>
              <div className="h-px bg-white/10" />
            </div>

            <div>
              <label className={label}>Urgency</label>
              <select className={field} value={form.urgency} onChange={(e) => update("urgency", e.target.value)}>
                {["Critical", "High", "Medium", "Scheduled"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Status</label>
              <select className={field} value={form.status} onChange={(e) => update("status", e.target.value)}>
                {["Open", "Matching", "Fulfilled", "Cancelled"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Patient Trust Score (0–100)</label>
              <input type="number" min={0} max={100} className={field} value={form.patient_trust_score} onChange={(e) => update("patient_trust_score", e.target.value)} />
            </div>
            <div>
              <label className={label}>Request Source</label>
              <select className={field} value={form.request_source} onChange={(e) => update("request_source", e.target.value)}>
                {["Website", "WhatsApp", "Voice Agent", "Hospital", "NGO"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 mt-4">
              <div className="font-mono text-xs text-[#FF4D6D] mb-1">04 · DONOR POOLS (optional)</div>
              <div className="h-px bg-white/10" />
            </div>

            <div>
              <label className={label}>Assigned Donor Pool</label>
              <input className={field} value={form.assigned_donor_pool} onChange={(e) => update("assigned_donor_pool", e.target.value)} placeholder="Comma-separated donor IDs" />
            </div>
            <div>
              <label className={label}>Backup Donor Pool</label>
              <input className={field} value={form.backup_donor_pool} onChange={(e) => update("backup_donor_pool", e.target.value)} placeholder="Comma-separated donor IDs" />
            </div>

            <div className="md:col-span-2 pt-4 flex flex-col md:flex-row md:items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white py-3.5 rounded-xl font-medium glow-red hover:scale-[1.01] transition-transform disabled:opacity-60 disabled:hover:scale-100"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching…</> : <>Submit to Sanjeevani Command</>}
              </button>
              <div className="text-xs text-white/40 md:max-w-xs">
                Data routes securely into the Sanjeevani Blood Bridge intake sheet for AI matching.
              </div>
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`md:col-span-2 rounded-xl border p-4 flex items-start gap-3 ${result.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}
              >
                {result.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />}
                <div className="text-sm">
                  <div className="font-medium">{result.msg}</div>
                  {result.id && <div className="text-white/50 mt-0.5 font-mono text-xs">Request ID: {result.id}</div>}
                </div>
              </motion.div>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
