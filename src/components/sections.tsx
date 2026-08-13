import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { VapiMicOrb, VapiTalkButton } from "@/components/VapiTalkButton";
import { useVapi } from "@/hooks/use-vapi";
import {
  Mic,
  ArrowRight,
  Play,
  Sparkles,
  Brain,
  Phone,
  Activity,
  Zap,
  Heart,
  Shield,
  Network,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Radio,
  Database,
  Cpu,
  Volume2,
} from "lucide-react";

const rotatingWords = [
  "Finding Donors.",
  "Saving Lives.",
  "Predicting Availability.",
  "Coordinating Care.",
  "Reducing Delays.",
  "Supporting Thalassemia.",
];

export function Hero() {
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % rotatingWords.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 grid-bg radial-fade opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,57,70,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,212,255,0.08),transparent_50%)]" />

      {/* Floating blood cells */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${(i * 13) % 100}%`,
            top: `${(i * 17) % 100}%`,
            width: `${20 + (i % 4) * 12}px`,
            height: `${20 + (i % 4) * 12}px`,
            background: `radial-gradient(circle at 30% 30%, #FF4D6D, #E63946 60%, #5a0a14 100%)`,
            filter: "blur(1px)",
            opacity: 0.25,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{
            duration: 12 + (i % 5) * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex justify-center mb-6"
        >
          <div className="glass-red rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#FF4D6D] animate-pulse-red" />
            <span className="uppercase tracking-wider">Series A · Healthcare AI</span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">Live in 18 states</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center font-display font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.02] tracking-tight max-w-5xl mx-auto"
        >
          India's First <span className="text-gradient-red">AI Blood</span>
          <br />
          Intelligence Platform
        </motion.h1>

        {/* Rotating word */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6 h-10"
        >
          <span className="text-white/50 text-lg mr-2">The AI infrastructure for</span>
          <motion.span
            key={wordIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="inline-block text-gradient-red font-display font-semibold text-lg"
          >
            {rotatingWords[wordIdx]}
          </motion.span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/60 text-lg max-w-2xl mx-auto mt-8 leading-relaxed"
        >
          Sanjeevani X combines Voice AI, Predictive Analytics, Donor Intelligence, and Real-Time
          Coordination to help patients receive blood faster than ever before.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-10"
        >
          <Link
            to="/request-blood"
            className="group bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white font-medium px-6 py-3 rounded-xl glow-red flex items-center gap-2 hover:scale-105 transition-transform"
          >
            Request Blood{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/donor-dashboard"
            className="glass rounded-xl px-6 py-3 font-medium hover:border-white/20 flex items-center gap-2"
          >
            <Heart className="w-4 h-4" /> Become Donor
          </Link>
          <VapiTalkButton className="glass-red rounded-xl px-6 py-3 font-medium flex items-center gap-2 hover:scale-105 transition-transform" />
          <Link
            to="/request-blood"
            search={{ emergency: true }}
            className="rounded-xl px-6 py-3 font-semibold flex items-center gap-2 border border-[#E63946]/50 bg-[#E63946]/15 text-[#FF4D6D] hover:bg-[#E63946]/25 transition"
          >
            <Siren className="w-4 h-4 animate-pulse" /> Emergency Request
          </Link>
          <button className="text-white/70 hover:text-white px-4 py-3 flex items-center gap-2 text-sm">
            <Play className="w-3.5 h-3.5" /> Watch Demo
          </button>

        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
        >
          {[
            { v: "25,000+", l: "Active Donors", icon: Heart },
            { v: "50,000+", l: "Units Coordinated", icon: Activity },
            { v: "150+", l: "Hospital Partners", icon: Shield },
            { v: "500+", l: "Field Volunteers", icon: Users },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-6 relative overflow-hidden group"
            >
              <s.icon className="w-5 h-5 text-[#FF4D6D] mb-3" />
              <div className="font-display text-3xl font-bold">{s.v}</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">{s.l}</div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#E63946]/20 rounded-full blur-2xl group-hover:bg-[#E63946]/40 transition-colors" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// =============================================================================
export function MarqueeStrip() {
  const items = [
    "AI Matching Engine",
    "Voice AI Outreach",
    "Predictive Demand",
    "Thalassemia Care",
    "Digital Blood Twin",
    "Real-Time Coordination",
    "Donor Intelligence",
    "RAG Memory Layer",
  ];
  return (
    <div className="border-y border-white/5 bg-white/[0.02] overflow-hidden py-4">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items, ...items].map((it, i) => (
          <div key={i} className="flex items-center gap-3 px-6 text-sm text-white/40">
            <Sparkles className="w-3.5 h-3.5 text-[#E63946]" />
            <span className="font-mono uppercase tracking-wider">{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
export function AISection() {
  const { isActive: listening } = useVapi();
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.15),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-red rounded-full px-4 py-1.5 text-xs uppercase tracking-wider mb-4">
            <Brain className="w-3 h-3" /> Voice AI Agent
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold">
            Meet <span className="text-gradient-red">Sanjeevani AI</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mt-4">
            A voice-native agent that finds donors, explains thalassemia, registers volunteers,
            guides hospitals, and supports patients — in 11 Indian languages.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Orb */}
          <div className="relative aspect-square max-w-md mx-auto w-full">
            <motion.div
              animate={{ scale: listening ? [1, 1.1, 1] : [1, 1.04, 1] }}
              transition={{ duration: listening ? 1 : 4, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF4D6D] via-[#E63946] to-[#5a0a14] glow-red blur-2xl opacity-60"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 rounded-full border border-[#E63946]/30 border-dashed"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-16 rounded-full border border-[#FF4D6D]/20"
            />
            <div className="absolute inset-24 rounded-full bg-gradient-to-br from-[#1a0408] to-black border border-[#E63946]/40 flex items-center justify-center">
              <VapiMicOrb />
            </div>
            {/* Waveform */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-12">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: listening ? [4, 30 + ((i * 7) % 20), 4] : 4 }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
                  className="w-1 bg-gradient-to-t from-[#E63946] to-[#FF4D6D] rounded-full"
                  style={{ height: 4 }}
                />
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5 max-w-md">
              <div className="flex items-center gap-2 text-xs text-white/40 mb-2 uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-white/40" /> Patient
              </div>
              <p className="text-white/90">
                Need <span className="text-[#FF4D6D] font-semibold">A+ blood</span> in Nashik
                urgently.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-red rounded-2xl p-5 max-w-md ml-auto"
            >
              <div className="flex items-center gap-2 text-xs text-[#FF4D6D] mb-2 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Sanjeevani AI
              </div>
              <p className="text-white/95">
                I found <span className="text-[#FF4D6D] font-bold">28 potential donors</span> within
                12km. Trust score average 87%. Would you like me to start outreach calls now?
              </p>
              <div className="flex gap-2 mt-3">
                <VapiTalkButton
                  className="text-xs bg-[#E63946] px-3 py-1.5 rounded-md font-medium"
                  inactiveLabel="Start outreach"
                  activeLabel="End call"
                  showError={false}
                />
                <Link to="/ai-engine" className="text-xs bg-white/5 px-3 py-1.5 rounded-md">
                  Show donors
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-4 max-w-md ml-auto"
            >
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-[#FF4D6D] animate-pulse" />
                <span className="text-white/70">Calling donor 1 of 28...</span>
                <span className="ml-auto font-mono text-xs text-white/40">00:14</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-2 max-w-md ml-auto mt-6">
              {[
                "Find donors",
                "Explain thalassemia",
                "Register volunteer",
                "Guide hospital",
                "Schedule donation",
                "Answer FAQ",
              ].map((c) => (
                <div
                  key={c}
                  className="glass rounded-lg px-3 py-2 text-xs text-white/70 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#FF4D6D]" /> {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
export function DirectCommSection() {
  return (
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass-red rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#E63946]/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#FF4D6D]/20 rounded-full blur-3xl" />

          <div className="relative grid lg:grid-cols-2 gap-12 p-10 lg:p-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-black/40 rounded-full px-3 py-1 text-xs uppercase tracking-wider mb-4">
                <Radio className="w-3 h-3 text-[#FF4D6D] animate-pulse" /> Live · Direct Line
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
                Talk directly to <span className="text-gradient-red">Sanjeevani</span>
                <br />
                Check donor availability in <span className="italic">seconds.</span>
              </h2>
              <p className="text-white/70 mt-4 text-lg">
                Skip forms, skip waits. Speak your blood group, city, and urgency — Sanjeevani's
                voice AI checks live donor availability across the network and responds instantly.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <VapiTalkButton
                  className="bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white px-6 py-3 rounded-xl glow-red flex items-center gap-2 font-medium hover:scale-105 transition-transform"
                  inactiveLabel="Start Voice Call"
                  activeLabel="End call"
                />
                <button className="bg-black/40 backdrop-blur rounded-xl px-6 py-3 flex items-center gap-2 font-medium border border-white/10">
                  <Phone className="w-4 h-4" /> Call 1800-SANJ-XAI
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> 11 languages
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF4D6D] animate-pulse" /> &lt;3s
                  response
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3" /> HIPAA compliant
                </div>
              </div>
            </div>

            {/* Live availability widget */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-white/50 uppercase tracking-wider">
                  Live Donor Availability
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { g: "O+", c: "Mumbai", n: 412, s: 92 },
                  { g: "A+", c: "Nashik", n: 128, s: 87 },
                  { g: "B-", c: "Pune", n: 34, s: 78, urgent: true },
                  { g: "AB-", c: "Delhi", n: 17, s: 71, urgent: true },
                  { g: "O-", c: "Bangalore", n: 89, s: 84 },
                ].map((d) => (
                  <div
                    key={d.g + d.c}
                    className={`flex items-center gap-3 p-3 rounded-lg ${d.urgent ? "bg-[#E63946]/15 border border-[#E63946]/30" : "bg-white/5"}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center font-display font-bold text-sm">
                      {d.g}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-white/40" /> {d.c}
                      </div>
                      <div className="text-xs text-white/50">
                        {d.n} available · Trust {d.s}%
                      </div>
                    </div>
                    {d.urgent ? (
                      <div className="text-xs px-2 py-1 rounded bg-[#E63946] text-white flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Low
                      </div>
                    ) : (
                      <div className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300">
                        OK
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Link
                to="/ai-engine"
                className="w-full mt-4 text-xs text-white/60 hover:text-white py-2 block text-center"
              >
                View full availability map →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
export function ProblemSolutionSection() {
  const problem = [
    "Patient needs blood",
    "Hospital starts calling",
    "Volunteers search WhatsApp",
    "Multiple donors unavailable",
    "Hours wasted",
    "Patient waits",
  ];
  const solution = [
    { icon: Activity, t: "Request enters system" },
    { icon: Shield, t: "AI validates request" },
    { icon: Network, t: "Matching engine activates" },
    { icon: Database, t: "RAG memory retrieves donor insights" },
    { icon: TrendingUp, t: "Prediction engine scores donors" },
    { icon: Volume2, t: "Voice AI contacts donors" },
    { icon: Heart, t: "Patient receives blood" },
    { icon: Cpu, t: "Memory updates automatically" },
  ];

  return (
    <section className="relative py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs uppercase tracking-wider mb-4">
            <Clock className="w-3 h-3 text-[#FF4D6D]" /> The Problem · The Solution
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold">
            From{" "}
            <span className="text-white/40 line-through decoration-[#E63946]">hours wasted</span> to{" "}
            <span className="text-gradient-red">seconds saved</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Problem */}
          <div className="glass rounded-3xl p-8">
            <div className="flex items-center gap-2 text-[#E63946] text-xs uppercase tracking-wider mb-6 font-mono">
              <AlertCircle className="w-4 h-4" /> Current Reality
            </div>
            <div className="space-y-3">
              {problem.map((p, i) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-white/50">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 bg-white/[0.02] rounded-lg px-4 py-3 border border-white/5">
                    <span className="text-white/70">{p}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { v: "4-8h", l: "Avg wait" },
                { v: "62%", l: "Calls unanswered" },
                { v: "31%", l: "No donor found" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="text-center p-3 bg-white/[0.02] rounded-lg border border-white/5"
                >
                  <div className="text-2xl font-display font-bold text-[#E63946]">{s.v}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/50">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Solution */}
          <div className="glass-red rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#E63946]/30 rounded-full blur-3xl" />
            <div className="flex items-center gap-2 text-[#FF4D6D] text-xs uppercase tracking-wider mb-6 font-mono">
              <Sparkles className="w-4 h-4" /> Sanjeevani X Pipeline
            </div>
            <div className="space-y-2.5 relative">
              {solution.map((s, i) => (
                <motion.div
                  key={s.t}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 bg-black/30 backdrop-blur border border-[#E63946]/20 rounded-lg p-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center">
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium flex-1">{s.t}</div>
                  <div className="font-mono text-[10px] text-white/40">→ {(i + 1) * 0.4}s</div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { v: "<3min", l: "Avg match" },
                { v: "94%", l: "Acceptance" },
                { v: "99.2%", l: "Donor found" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="text-center p-3 bg-black/40 rounded-lg border border-[#E63946]/20"
                >
                  <div className="text-2xl font-display font-bold text-gradient-red">{s.v}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
export function ThalassemiaSection() {
  const cards = [
    {
      icon: Shield,
      t: "Carrier Detection",
      d: "Screen entire families with predictive genetic risk modeling.",
    },
    {
      icon: Brain,
      t: "Genetic Awareness",
      d: "Education programs targeted to at-risk communities.",
    },
    {
      icon: Heart,
      t: "Recurring Transfusion Support",
      d: "Lifetime tracking of every transfusion event.",
    },
    {
      icon: Clock,
      t: "Predictive Scheduling",
      d: "AI forecasts the next transfusion 30 days in advance.",
    },
    {
      icon: Users,
      t: "Donor Pool Assignment",
      d: "Each patient gets a dedicated rotating donor cohort.",
    },
    {
      icon: Activity,
      t: "Lifetime Care Tracking",
      d: "Integrated medical timeline for every patient.",
    },
  ];
  const journey = [
    "Child diagnosed",
    "Patient onboarded",
    "Monthly transfusions tracked",
    "Dedicated donor network created",
    "AI predicts future needs",
    "Risk reduced",
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 dot-bg radial-fade opacity-50" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-red rounded-full px-4 py-1.5 text-xs uppercase tracking-wider mb-4">
            <Heart className="w-3 h-3" /> Thalassemia Care
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold">
            End Thalassemia
            <br />
            Through <span className="text-gradient-red">Intelligence</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mt-4">
            Thalassemia patients need transfusions every 15-30 days for life. Sanjeevani X builds
            dedicated donor cohorts and predictive schedules for each patient.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {cards.map((c, i) => (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-6 relative group overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D6D]/20 to-[#E63946]/20 border border-[#E63946]/30 flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-[#FF4D6D]" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{c.t}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{c.d}</p>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#E63946]/0 group-hover:bg-[#E63946]/15 transition-colors rounded-full blur-3xl" />
            </motion.div>
          ))}
        </div>

        {/* Journey */}
        <div className="glass rounded-3xl p-8 lg:p-12">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-6 font-mono">
            Patient Journey
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {journey.map((step, i) => (
              <div key={step} className="relative">
                <div className="text-xs font-mono text-[#FF4D6D]">STEP {i + 1}</div>
                <div className="mt-2 font-display font-medium text-sm leading-tight">{step}</div>
                <div className="mt-3 h-1 bg-gradient-to-r from-[#E63946] via-[#FF4D6D] to-transparent rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
export function CommandCenterPreview() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 grid-bg radial-fade opacity-30" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs uppercase tracking-wider mb-4">
            <Radio className="w-3 h-3 text-[#FF4D6D] animate-pulse" /> Command Center
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold">
            Mission Control for <span className="text-gradient-red">Lives.</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mt-4">
            Watch every active request, every AI call, every coordination event — in real time.
          </p>
        </div>

        <div className="glass rounded-3xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF4D6D] to-transparent" />
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-mono uppercase tracking-wider">
                Sanjeevani X · Live Ops
              </span>
            </div>
            <div className="flex gap-2 text-xs font-mono text-white/40">
              <span>UTC 14:32:08</span>
              <span>· 18 STATES</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-4 mb-6">
            {[
              { l: "Active Requests", v: "247", c: "text-[#FF4D6D]" },
              { l: "AI Calls Running", v: "89", c: "text-cyan-300" },
              { l: "Donors Online", v: "8,431", c: "text-green-400" },
              { l: "Emergency Cases", v: "12", c: "text-orange-400" },
            ].map((s) => (
              <div key={s.l} className="bg-black/30 border border-white/5 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-white/40 mb-1">{s.l}</div>
                <div className={`font-display text-3xl font-bold ${s.c}`}>{s.v}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Request feed */}
            <div className="lg:col-span-2 bg-black/30 border border-white/5 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-4 font-mono">
                Live Request Feed
              </div>
              <div className="space-y-2">
                {[
                  { id: "REQ-8421", g: "O-", c: "Mumbai", st: "matching", d: "Hospital: Lilavati" },
                  { id: "REQ-8420", g: "AB+", c: "Pune", st: "calling", d: "12 donors contacted" },
                  { id: "REQ-8419", g: "B-", c: "Nashik", st: "confirmed", d: "Donor en-route" },
                  { id: "REQ-8418", g: "A+", c: "Delhi", st: "delivered", d: "Unit transfused" },
                  {
                    id: "REQ-8417",
                    g: "O+",
                    c: "Bangalore",
                    st: "matching",
                    d: "Hospital: Manipal",
                  },
                ].map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5 hover:border-[#E63946]/30 transition-colors"
                  >
                    <div className="font-mono text-xs text-white/40 w-20">{r.id}</div>
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center text-xs font-bold">
                      {r.g}
                    </div>
                    <div className="flex-1 text-sm">
                      <div>{r.c}</div>
                      <div className="text-xs text-white/40">{r.d}</div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        r.st === "delivered"
                          ? "bg-green-500/20 text-green-300"
                          : r.st === "confirmed"
                            ? "bg-cyan-500/20 text-cyan-300"
                            : r.st === "calling"
                              ? "bg-orange-500/20 text-orange-300 animate-pulse"
                              : "bg-[#E63946]/20 text-[#FF4D6D] animate-pulse"
                      }`}
                    >
                      {r.st}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System health */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-4 font-mono">
                System Health
              </div>
              <div className="space-y-3">
                {[
                  { n: "Matching Engine", v: 98, s: "OK" },
                  { n: "Voice AI", v: 94, s: "OK" },
                  { n: "RAG Memory", v: 99, s: "OK" },
                  { n: "SMS Gateway", v: 87, s: "Degraded" },
                  { n: "Hospital API", v: 100, s: "OK" },
                ].map((h) => (
                  <div key={h.n}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70">{h.n}</span>
                      <span className={h.s === "OK" ? "text-green-400" : "text-orange-400"}>
                        {h.s}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${h.v}%` }}
                        viewport={{ once: true }}
                        className={`h-full ${h.s === "OK" ? "bg-gradient-to-r from-green-500 to-green-400" : "bg-gradient-to-r from-orange-500 to-yellow-400"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
export function ImpactSection() {
  const stats = [
    { v: "25K+", l: "Donors", c: "from-[#FF4D6D] to-[#E63946]" },
    { v: "150+", l: "Hospitals", c: "from-cyan-400 to-blue-500" },
    { v: "12K", l: "Patients supported", c: "from-[#FF4D6D] to-[#E63946]" },
    { v: "50K+", l: "Transfusions", c: "from-cyan-400 to-blue-500" },
    { v: "98K", l: "Lives impacted", c: "from-[#FF4D6D] to-[#E63946]" },
    { v: "18", l: "States", c: "from-cyan-400 to-blue-500" },
  ];
  return (
    <section className="relative py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-1">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs uppercase tracking-wider mb-4">
              <MapPin className="w-3 h-3 text-[#FF4D6D]" /> National Impact
            </div>
            <h2 className="font-display text-5xl font-bold mb-4">
              A nationwide
              <br />
              <span className="text-gradient-red">blood network.</span>
            </h2>
            <p className="text-white/60">
              Live across 18 Indian states. Coordinating with hospitals, NGOs, labs, and government
              agencies to ensure no patient waits.
            </p>
            <Link
              to="/command-center"
              className="mt-6 glass-red rounded-xl px-5 py-3 inline-flex items-center gap-2 text-sm font-medium"
            >
              See impact map <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-6 relative overflow-hidden group"
              >
                <div
                  className={`font-display text-4xl font-bold bg-gradient-to-br ${s.c} bg-clip-text text-transparent`}
                >
                  {s.v}
                </div>
                <div className="text-xs uppercase tracking-wider text-white/50 mt-1">{s.l}</div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E63946] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
export function FinalCTA() {
  return (
    <section className="relative py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative glass-red rounded-3xl p-12 lg:p-20 text-center overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#E63946]/40 rounded-full blur-3xl" />
          <div className="relative">
            <Zap className="w-10 h-10 text-[#FF4D6D] mx-auto mb-6" />
            <h2 className="font-display text-5xl md:text-6xl font-bold leading-tight">
              Be a <span className="text-gradient-red">Blood Warrior.</span>
              <br />
              Save a life this week.
            </h2>
            <p className="text-white/70 mt-6 max-w-xl mx-auto">
              Whether you're a donor, hospital, NGO, or volunteer — Sanjeevani X gives you the tools
              to act faster than ever.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              <button className="bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white px-7 py-3.5 rounded-xl glow-red font-medium hover:scale-105 transition-transform">
                Join the network
              </button>
              <button className="bg-black/40 backdrop-blur border border-white/10 px-7 py-3.5 rounded-xl font-medium">
                Talk to sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
