import { Link } from "@tanstack/react-router";
import { Activity, Phone, Mail, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";

export function Footer() {
  const cols = [
    {
      title: "Platform",
      links: [
        { label: "Blood Bridge AI", to: "/blood-bridge" },
        { label: "AI Engine", to: "/ai-engine" },
        { label: "Digital Blood Twin", to: "/digital-blood-twin" },
        { label: "Command Center", to: "/command-center" },
        { label: "Research", to: "/research" },
      ],
    },
    {
      title: "Network",
      links: [
        { label: "Donors", to: "/donors" },
        { label: "Hospitals", to: "/hospitals" },
        { label: "Volunteers", to: "/volunteers" },
        { label: "Donor Intelligence", to: "/donor-intelligence" },
        { label: "Partners", to: "/partners" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Success Stories", to: "/stories" },
        { label: "National Impact", to: "/impact" },
        { label: "Research", to: "/research" },
        { label: "Thalassemia Care", to: "/" },
      ],
    },
  ];
  return (
    <footer className="relative mt-32 border-t border-white/5">
      <div className="absolute inset-0 grid-bg radial-fade opacity-30 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-10">
        <div className="grid lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center glow-red-sm">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-2xl">
                Sanjeevani <span className="text-gradient-red">X</span>
              </span>
            </div>
            <p className="text-white/60 text-sm max-w-sm leading-relaxed mb-6">
              The AI Infrastructure Behind Blood Accessibility. Building the future of donor
              intelligence and thalassemia care in India.
            </p>
            <div className="glass-red rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E63946] flex items-center justify-center animate-pulse-red">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-white/60 uppercase tracking-wider">
                    24/7 Emergency Helpline
                  </div>
                  <div className="font-mono font-semibold">+91 1800-SANJ-XAI</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:glow-red-sm hover:border-[#E63946]/40 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-white/60 hover:text-[#FF4D6D] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="lg:col-span-2">
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">
              Newsletter
            </h4>
            <p className="text-xs text-white/50 mb-3">AI insights, weekly.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="you@email.com"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E63946]"
              />
            </div>
            <button className="mt-2 w-full text-sm bg-white/10 hover:bg-[#E63946] transition-colors rounded-lg px-3 py-2 flex items-center justify-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Subscribe
            </button>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div>© 2026 Sanjeevani X · Built for Blood Warriors · Made in India 🇮🇳</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
            <a href="#" className="hover:text-white">
              Security
            </a>
            <a href="#" className="hover:text-white">
              HIPAA
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
