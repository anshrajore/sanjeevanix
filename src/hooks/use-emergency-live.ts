import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { getEmergencyStatus, expireEmergencyRequest } from "@/lib/emergency.functions";

/**
 * Live emergency dispatch state. Seeds from the server, then keeps itself
 * fresh through Supabase realtime on emergency_requests + notifications.
 */
export function useEmergencyLive(requestId: string | null) {
  const fetchStatus = useServerFn(getEmergencyStatus);
  const expire = useServerFn(expireEmergencyRequest);
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["emergency-status", requestId], [requestId]);
  const [now, setNow] = useState(() => Date.now());
  const [connected, setConnected] = useState(false);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchStatus({ data: { requestId: requestId as string } }),
    enabled: Boolean(requestId),
    refetchInterval: connected ? 30_000 : 8_000,
  });

  useEffect(() => {
    if (!requestId) return;
    const invalidate = () => void queryClient.invalidateQueries({ queryKey });

    const channel = supabase
      .channel(`emergency-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emergency_requests",
          filter: `id=eq.${requestId}`,
        },
        invalidate,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emergency_notifications",
          filter: `request_id=eq.${requestId}`,
        },
        invalidate,
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      setConnected(false);
      void supabase.removeChannel(channel);
    };
  }, [requestId, queryClient, queryKey]);

  // 1s ticker so the ETA countdown moves without refetching.
  useEffect(() => {
    if (!requestId) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [requestId]);

  const request = query.data?.request ?? null;
  const expiresAt = request?.expires_at ? new Date(request.expires_at).getTime() : null;
  const secondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;
  const openStatus = request?.status === "notified" || request?.status === "dispatching";

  // Auto-close the window once the deadline passes; the server notifies the requester.
  useEffect(() => {
    if (!requestId || !openStatus || secondsLeft === null || secondsLeft > 0) return;
    void expire({ data: { requestId } })
      .then(() => queryClient.invalidateQueries({ queryKey }))
      .catch(() => undefined);
  }, [requestId, openStatus, secondsLeft, expire, queryClient, queryKey]);

  return {
    ...query,
    connected,
    request,
    notifications: query.data?.notifications ?? [],
    secondsLeft,
  };
}

export function formatCountdown(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
