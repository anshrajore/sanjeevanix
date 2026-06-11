import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { VAPI_ASSISTANT_ID, getVapiPublicKey } from "@/lib/vapi-config";

type VapiContextValue = {
  isActive: boolean;
  error: string | null;
  isConfigured: boolean;
  startCall: () => Promise<void>;
  stopCall: () => void;
  toggleCall: () => void;
};

const VapiContext = createContext<VapiContextValue | null>(null);

export function VapiProvider({ children }: { children: React.ReactNode }) {
  // Use `any` to avoid SSR-time type evaluation of the browser-only SDK.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(getVapiPublicKey());

  const ensureVapi = useCallback(async () => {
    if (typeof window === "undefined") return null;
    const publicKey = getVapiPublicKey();
    if (!publicKey) return null;
    if (vapiRef.current) return vapiRef.current;
    try {
      const mod = await import("@vapi-ai/web");
      const Vapi = mod.default;
      const vapi = new Vapi(publicKey);
      vapi.on("call-start", () => {
        setIsActive(true);
        setError(null);
      });
      vapi.on("call-end", () => setIsActive(false));
      vapi.on("error", (e: { message?: string }) => {
        setError(e?.message ?? "Voice call failed.");
        setIsActive(false);
      });
      vapiRef.current = vapi;
      return vapi;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voice SDK failed to load.");
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        vapiRef.current?.stop?.();
      } catch {
        /* noop */
      }
      vapiRef.current = null;
    };
  }, []);

  const startCall = useCallback(async () => {
    const vapi = await ensureVapi();
    if (!vapi) {
      setError("Voice AI is not configured. Set VITE_VAPI_PUBLIC_KEY in your environment.");
      return;
    }
    try {
      setError(null);
      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start voice call.");
    }
  }, [ensureVapi]);

  const stopCall = useCallback(() => {
    try {
      vapiRef.current?.stop?.();
    } catch {
      /* noop */
    }
    setIsActive(false);
  }, []);

  const toggleCall = useCallback(() => {
    if (isActive) stopCall();
    else void startCall();
  }, [isActive, startCall, stopCall]);

  const value = useMemo(
    () => ({
      isActive,
      error,
      isConfigured: configured,
      startCall,
      stopCall,
      toggleCall,
    }),
    [isActive, error, configured, startCall, stopCall, toggleCall],
  );

  return <VapiContext.Provider value={value}>{children}</VapiContext.Provider>;
}

export function useVapiContext() {
  const ctx = useContext(VapiContext);
  if (!ctx) throw new Error("useVapiContext must be used within VapiProvider");
  return ctx;
}
