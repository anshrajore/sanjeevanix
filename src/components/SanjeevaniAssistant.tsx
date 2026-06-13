import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Sparkles, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Find O- donor in Mumbai",
  "Show critical cases right now",
  "What's the AI prediction accuracy?",
  "Call backup donor pool for REQ001",
];

const SCRIPTED: Record<string, string> = {
  default:
    "I'm Sanjeevani, your AI Operating System. I can find donors, trigger voice outreach, predict shortages, and coordinate hospitals nationwide.",
};

function reply(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("o-") || lower.includes("o negative"))
    return "Located 7 eligible O- donors in Mumbai. Top match: D012 (trust 96, response 92%). Dispatching VAPI call now.";
  if (lower.includes("critical"))
    return "3 critical cases active — Aarav Sharma (Lilavati, O+, 2u), Priya Patel (Kokilaben, A+, 1u), Rohit Verma (Apollo Chennai, B-, 3u). Coordinators alerted.";
  if (lower.includes("prediction") || lower.includes("accuracy"))
    return "Current AI prediction accuracy: 94.2%. Donor acceptance model retrained 6h ago on 12,847 outcomes.";
  if (lower.includes("call") || lower.includes("backup"))
    return "Initiating cascade to backup pool for REQ001 — dialing D031, D067, D040 in parallel via VAPI. Expected first acceptance in 47 seconds.";
  return SCRIPTED.default;
}

export function SanjeevaniAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: 'Hello — say "Hey Sanjeevani" or type a command.' },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "assistant", text: reply(text) }]);
    }, 600);
  };

  const toggleMic = () => {
    setListening((l) => !l);
    if (!listening) {
      setTimeout(() => {
        setListening(false);
        send("Show critical cases right now");
      }, 1800);
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#E63946] shadow-2xl flex items-center justify-center glow-red"
        aria-label="Open Sanjeevani AI"
      >
        <Sparkles className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#34D399] rounded-full ring-2 ring-[#0F172A] animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] glass rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[#FF4D6D]/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Sanjeevani AI</div>
                  <div className="text-[10px] text-white/40 font-mono">OPERATING SYSTEM · v4.0</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] text-sm rounded-2xl px-3 py-2 ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white"
                        : "bg-white/5 text-white/90"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {msgs.length <= 1 && (
                <div className="pt-2 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-white/30 font-mono">
                    Try
                  </div>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left text-xs glass rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-white/[0.06] transition border border-white/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/5 flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                  listening
                    ? "bg-[#FF4D6D] text-white animate-pulse"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder={listening ? "Listening…" : "Ask Sanjeevani anything"}
                className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm focus:outline-none border border-white/10 focus:border-white/20"
              />
              <button
                onClick={() => send(input)}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF4D6D] to-[#E63946] flex items-center justify-center"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
