import { useEffect, useRef, useState } from "react";
import { useRole } from "@/hooks/use-role";
import { ROLE_META, type Role } from "@/lib/bloodbridge";
import { useNavigate } from "@tanstack/react-router";
import { Shield, Building2, Database, Heart, User, ChevronDown } from "lucide-react";

const ICONS: Record<Role, typeof Shield> = {
  admin: Shield,
  hospital: Building2,
  blood_bank: Database,
  donor: Heart,
  patient: User,
};

const ORDER: Role[] = ["admin", "hospital", "blood_bank", "donor", "patient"];

export function RoleSwitcher() {
  const [role, setRole] = useRole();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  const meta = ROLE_META[role];
  const Icon = ICONS[role];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/10 hover:border-white/20 transition"
        style={{ boxShadow: `0 0 0 1px ${meta.accent}22` }}
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: meta.accent }}
        />
        <Icon className="w-3.5 h-3.5" style={{ color: meta.accent }} />
        <span className="text-xs font-medium">{meta.label}</span>
        <ChevronDown className="w-3 h-3 text-white/40" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 glass rounded-2xl border border-white/10 overflow-hidden z-50 shadow-2xl">
          <div className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono border-b border-white/5">
            Switch Identity · Demo
          </div>
          {ORDER.map((r) => {
            const m = ROLE_META[r];
            const I = ICONS[r];
            const active = r === role;
            return (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setOpen(false);
                  navigate({ to: m.home });
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition ${
                  active ? "bg-white/[0.04]" : ""
                }`}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${m.accent}18`, color: m.accent }}
                >
                  <I className="w-4 h-4" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-[10px] text-white/40 font-mono">{m.home}</div>
                </div>
                {active && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: m.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
