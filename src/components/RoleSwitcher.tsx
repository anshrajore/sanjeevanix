import { useRole } from "@/hooks/use-role";
import type { Role } from "@/lib/bloodbridge";
import { Heart, Building2, Shield } from "lucide-react";

const ROLES: { id: Role; label: string; icon: typeof Heart }[] = [
  { id: "donor", label: "Donor", icon: Heart },
  { id: "hospital", label: "Hospital", icon: Building2 },
  { id: "admin", label: "Admin", icon: Shield },
];

export function RoleSwitcher() {
  const [role, setRole] = useRole();
  return (
    <div className="hidden md:flex items-center gap-1 glass rounded-full p-1 border border-white/10">
      {ROLES.map((r) => {
        const active = role === r.id;
        const Icon = r.icon;
        return (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              active
                ? "bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Icon className="w-3 h-3" />
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
