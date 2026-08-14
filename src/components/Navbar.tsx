import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import logoAsset from "@/assets/sanjeevani-logo.png.asset.json";
import { RoleSwitcher } from "./RoleSwitcher";
import { useRole } from "@/hooks/use-role";
import { ROLE_META, type Role } from "@/lib/bloodbridge";

const ROLE_LINKS: Record<Role, { to: string; label: string }[]> = {
  admin: [
    { to: "/admin", label: "Executive" },
    { to: "/admin-console", label: "Admin Console" },
    { to: "/national-command-map", label: "National Map" },
    { to: "/command-center", label: "Command" },
    { to: "/requests", label: "Requests" },
    { to: "/donors", label: "Directory" },
    { to: "/risk-map", label: "Risk Map" },
  ],
  hospital: [
    { to: "/hospital-dashboard", label: "Hospital" },
    { to: "/requests", label: "Requests" },
    { to: "/command-center", label: "Command" },
    { to: "/donors", label: "Directory" },
    { to: "/risk-map", label: "Risk Map" },
  ],
  blood_bank: [
    { to: "/blood-bank", label: "Inventory" },
    { to: "/national-command-map", label: "National Map" },
    { to: "/requests", label: "Requests" },
    { to: "/risk-map", label: "Risk Map" },
  ],
  donor: [
    { to: "/donor-dashboard", label: "My Dashboard" },
    { to: "/donors", label: "Directory" },
    { to: "/impact", label: "Impact" },
    { to: "/stories", label: "Stories" },
  ],
  patient: [
    { to: "/patient-dashboard", label: "My Care" },
    { to: "/digital-blood-twin", label: "Digital Twin" },
    { to: "/stories", label: "Stories" },
    { to: "/impact", label: "Impact" },
  ],
};

export function Navbar() {
  const [role] = useRole();
  const links = ROLE_LINKS[role];
  const accent = ROLE_META[role].accent;

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 inset-x-0 z-50 px-4 pt-4"
    >
      <div
        className="mx-auto max-w-7xl glass rounded-2xl flex items-center justify-between px-5 py-3 gap-4"
        style={{ boxShadow: `0 0 0 1px ${accent}22, 0 20px 60px -20px ${accent}30` }}
      >
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="bg-white rounded-lg px-2 py-1 flex items-center">
            <img
              src={logoAsset.url}
              alt="Sanjeevani X — Blood Bridge AI Autonomous Platform"
              className="h-7 w-auto object-contain"
            />
          </div>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              activeProps={{ className: "px-3 py-1.5 text-sm text-white bg-white/10 rounded-lg" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <RoleSwitcher />
          <Link
            to="/request-blood"
            className="text-sm font-medium bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white px-4 py-2 rounded-lg glow-red-sm hover:scale-105 transition-transform"
          >
            Request Blood
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
