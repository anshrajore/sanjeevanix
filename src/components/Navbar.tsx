import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function Navbar() {
  const links = [
    { to: "/blood-bridge", label: "Blood Bridge" },
    { to: "/ai-engine", label: "AI Engine" },
    { to: "/digital-blood-twin", label: "Digital Twin" },
    { to: "/command-center", label: "Command" },
    { to: "/impact", label: "Impact" },
    { to: "/stories", label: "Stories" },
  ];
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 inset-x-0 z-50 px-4 pt-4"
    >
      <div className="mx-auto max-w-7xl glass rounded-2xl flex items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center glow-red-sm">
              <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Sanjeevani <span className="text-gradient-red">X</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden sm:block text-sm text-white/70 hover:text-white px-3 py-1.5">Sign in</button>
          <button className="text-sm font-medium bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white px-4 py-2 rounded-lg glow-red-sm hover:scale-105 transition-transform">
            Request Blood
          </button>
        </div>
      </div>
    </motion.header>
  );
}
