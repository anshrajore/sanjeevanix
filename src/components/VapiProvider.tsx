import Vapi from "@vapi-ai/web";
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
  const vapiRef = useRef<Vapi | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(getVapiPublicKey());

  useEffect(() => {
    const publicKey = getVapiPublicKey();
    if (!publicKey) return;

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

    return () => {
      vapi.stop();
      vapiRef.current = null;
    };
  }, []);

  const startCall = useCallback(async () => {
    const publicKey = getVapiPublicKey();
    if (!publicKey) {
      setError("Voice AI is not configured. Set VITE_VAPI_PUBLIC_KEY in your environment.");
      return;
    }

    const vapi = vapiRef.current ?? new Vapi(publicKey);
    vapiRef.current = vapi;

    try {
      setError(null);
      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start voice call.");
    }
  }, []);

  const stopCall = useCallback(() => {
    vapiRef.current?.stop();
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
