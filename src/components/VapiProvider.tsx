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
  wakeListening: boolean;
  wakeSupported: boolean;
  startCall: () => Promise<void>;
  stopCall: () => void;
  toggleCall: () => void;
  setWakeListening: (on: boolean) => void;
};

const VapiContext = createContext<VapiContextValue | null>(null);

// Lightweight wake-word matcher — "hey sanjeevani" with common mishearings.
const WAKE_PATTERNS = [
  /\bhey\s+san?jee?v(a|e)ni\b/i,
  /\bhi\s+san?jee?v(a|e)ni\b/i,
  /\bok\s+san?jee?v(a|e)ni\b/i,
  /\bsanjeevani\s+wake\s+up\b/i,
];

function matchesWakeWord(transcript: string): boolean {
  return WAKE_PATTERNS.some((re) => re.test(transcript));
}

export function VapiProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wakeListening, setWakeListeningState] = useState(false);
  const [wakeSupported, setWakeSupported] = useState(false);
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

  const startCall = useCallback(async () => {
    setError(null);
    const vapi = await ensureVapi();
    if (!vapi) {
      // ensureVapi already set a specific error (SDK load failure, etc.).
      // Only set a generic fallback if nothing was captured.
      setError((prev) => prev ?? "Could not initialize voice assistant. Please retry.");
      return;
    }
    try {
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

  // --- Wake-word listener (Web Speech API) ---------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    setWakeSupported(Boolean(SR));
  }, []);

  const setWakeListening = useCallback(
    (on: boolean) => {
      if (typeof window === "undefined") return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SR) {
        setError("Wake-word listening not supported in this browser. Try Chrome.");
        return;
      }
      if (!on) {
        try {
          recogRef.current?.stop?.();
        } catch {
          /* noop */
        }
        recogRef.current = null;
        setWakeListeningState(false);
        return;
      }
      try {
        const r = new SR();
        r.continuous = true;
        r.interimResults = true;
        r.lang = "en-US";
        r.onresult = (ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => {
          const results = Array.from(ev.results as unknown as Array<{ 0: { transcript: string } }>);
          const transcript = results.map((res) => res[0].transcript).join(" ");
          if (matchesWakeWord(transcript)) {
            try {
              r.stop();
            } catch {
              /* noop */
            }
            setWakeListeningState(false);
            void startCall();
          }
        };
        r.onerror = (e: { error?: string }) => {
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setError("Microphone access denied. Allow mic to enable wake-word.");
            setWakeListeningState(false);
          }
        };
        r.onend = () => {
          // Auto-restart while we still want to listen and aren't in a call
          if (recogRef.current === r && !vapiRef.current?.isStarted) {
            try {
              r.start();
            } catch {
              /* noop */
            }
          }
        };
        recogRef.current = r;
        r.start();
        setWakeListeningState(true);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start wake-word listener.");
      }
    },
    [startCall],
  );

  useEffect(() => {
    return () => {
      try {
        vapiRef.current?.stop?.();
      } catch {
        /* noop */
      }
      try {
        recogRef.current?.stop?.();
      } catch {
        /* noop */
      }
      vapiRef.current = null;
      recogRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({
      isActive,
      error,
      isConfigured: configured,
      wakeListening,
      wakeSupported,
      startCall,
      stopCall,
      toggleCall,
      setWakeListening,
    }),
    [isActive, error, configured, wakeListening, wakeSupported, startCall, stopCall, toggleCall, setWakeListening],
  );

  return <VapiContext.Provider value={value}>{children}</VapiContext.Provider>;
}

export function useVapiContext() {
  const ctx = useContext(VapiContext);
  if (!ctx) throw new Error("useVapiContext must be used within VapiProvider");
  return ctx;
}
