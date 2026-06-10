import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import logoAsset from "@/assets/sanjeevani-logo.png.asset.json";
import { RoleSwitcher } from "./RoleSwitcher";
import { useRole } from "@/hooks/use-role";

export function Navbar() {
  const [role] = useRole();

  const linksByRole = {
    donor: [
      { to: "/donors", label: "Directory" },
      { to: "/risk-map", label: "Risk Map" },
      { to: "/impact", label: "My Impact" },
      { to: "/stories", label: "Stories" },
    ],
    hospital: [
      { to: "/requests", label: "Requests" },
      { to: "/donors", label: "Directory" },
      { to: "/risk-map", label: "Risk Map" },
      { to: "/command-center", label: "Command" },
    ],
    admin: [
      { to: "/admin", label: "Dashboard" },
      { to: "/requests", label: "Requests" },
      { to: "/risk-map", label: "Risk Map" },
      { to: "/donors", label: "Donors" },
      { to: "/command-center", label: "Command" },
    ],
  } as const;

  const links = linksByRole[role];

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 inset-x-0 z-50 px-4 pt-4"
    >
      <div className="mx-auto max-w-7xl glass rounded-2xl flex items-center justify-between px-5 py-3 gap-4">
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
