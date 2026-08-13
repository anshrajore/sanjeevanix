import { useEffect, useMemo, useState } from "react";

import { buildRiskSnapshot, type RiskSnapshot } from "@/lib/city-risk";

/**
 * Live city risk feed. Recomputes from the donor registry, hospital inventory
 * and open-request queue on an interval so the dashboard reflects pressure
 * changes without a page reload.
 */
export function useCityRisk(intervalMs = 8000): { snapshot: RiskSnapshot; tick: number } {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  const snapshot = useMemo(() => buildRiskSnapshot(tick), [tick]);
  return { snapshot, tick };
}
