import { useEffect, useState } from "react";
import { getRole, type Role } from "@/lib/bloodbridge";

export function useRole(): [Role, (r: Role) => void] {
  const [role, setRoleState] = useState<Role>("admin");
  useEffect(() => {
    setRoleState(getRole());
    const h = () => setRoleState(getRole());
    window.addEventListener("bb-role-change", h);
    return () => window.removeEventListener("bb-role-change", h);
  }, []);
  return [
    role,
    (r: Role) => {
      import("@/lib/bloodbridge").then((m) => m.setRole(r));
    },
  ];
}
