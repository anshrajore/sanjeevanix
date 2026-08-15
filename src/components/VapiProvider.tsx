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

export type MicPermission = "unknown" | "prompt" | "granted" | "denied";

type VapiContextValue = {
  isActive: boolean;
  isConnecting: boolean;
  error: string | null;
  /** True when the failure can be fixed by granting microphone access. */
  needsMic: boolean;
  micPermission: MicPermission;
  isConfigured: boolean;
  wakeListening: boolean;
  wakeSupported: boolean;
  startCall: () => Promise<void>;
  stopCall: () => void;
  toggleCall: () => void;
  retry: () => void;
  requestMicAccess: () => Promise<boolean>;
  clearError: () => void;
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

function isMicError(message: string): boolean {
  return /permission|not-?allowed|denied|microphone|audio|NotFound|NotReadable|device/i.test(
    message,
  );
}

export function VapiProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsMic, setNeedsMic] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");
  const [wakeListening, setWakeListeningState] = useState(false);
  const [wakeSupported, setWakeSupported] = useState(false);
  const configured = Boolean(getVapiPublicKey());

  const fail = useCallback((message: string) => {
    setError(message);
    setNeedsMic(isMicError(message));
    setIsConnecting(false);
    setIsActive(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setNeedsMic(false);
  }, []);

  // Track browser mic permission where the Permissions API is available.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let status: PermissionStatus | null = null;
    const onChange = () => {
      if (status) setMicPermission(status.state as MicPermission);
    };
    navigator.permissions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query({ name: "microphone" as any })
      .then((s) => {
        status = s;
        setMicPermission(s.state as MicPermission);
        s.addEventListener("change", onChange);
      })
      .catch(() => setMicPermission("unknown"));
    return () => status?.removeEventListener("change", onChange);
  }, []);

  const requestMicAccess = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      fail("This browser can't access a microphone. Try Chrome, Edge or Safari.");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      clearError();
      return true;
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setMicPermission(name === "NotAllowedError" ? "denied" : micPermission);
      setNeedsMic(true);
      setError(
        name === "NotFoundError"
          ? "No microphone found. Connect a mic or headset, then try again."
          : "Microphone access is blocked. Allow the mic for this site in your browser's address bar, then retry.",
      );
      return false;
    }
  }, [clearError, fail, micPermission]);

  const ensureVapi = useCallback(async () => {
    if (typeof window === "undefined") return null;
    const publicKey = getVapiPublicKey();
    if (!publicKey) {
      fail("Voice AI key is missing. Set VITE_VAPI_PUBLIC_KEY to enable calls.");
      return null;
    }
    if (vapiRef.current) return vapiRef.current;
    try {
      const mod = await import("@vapi-ai/web");
      type VapiConstructor = new (key: string) => {
        on: (event: string, callback: (...args: any[]) => void) => void;
        start: (assistantId: string) => Promise<unknown>;
        stop: () => void;
      };
      const candidate = mod.default as unknown;
      const Vapi: VapiConstructor | null =
        typeof candidate === "function"
          ? (candidate as VapiConstructor)
          : typeof (candidate as { default?: unknown })?.default === "function"
            ? (candidate as { default: VapiConstructor }).default
            : null;
      if (!Vapi) throw new Error("Voice engine loaded in an unsupported format. Refresh and retry.");
      const vapi = new Vapi(publicKey);
      vapi.on("call-start", () => {
        setIsActive(true);
        setIsConnecting(false);
        clearError();
      });
      vapi.on("call-end", () => {
        setIsActive(false);
        setIsConnecting(false);
      });
      vapi.on("error", (e: { message?: string; error?: { message?: string } }) => {
        fail(e?.message ?? e?.error?.message ?? "The voice call dropped. Please retry.");
      });
      vapiRef.current = vapi;
      return vapi;
    } catch (e) {
      vapiRef.current = null;
      fail(e instanceof Error ? e.message : "Voice engine failed to load. Check your connection.");
      return null;
    }
  }, [clearError, fail]);

  const startCall = useCallback(async () => {
    if (isConnecting || isActive) return;
    clearError();
    setIsConnecting(true);

    if (recogRef.current) {
      try {
        recogRef.current.stop?.();
      } catch {
        /* noop */
      }
      recogRef.current = null;
      setWakeListeningState(false);
    }

    const micOk = await requestMicAccess();
    if (!micOk) return;

    const vapi = await ensureVapi();
    if (!vapi) return;

    try {
      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      try {
        vapi.stop?.();
      } catch {
        /* noop */
      }
      vapiRef.current = null;
      fail(err instanceof Error ? err.message : "Could not start the voice call. Please retry.");
    }
  }, [clearError, ensureVapi, fail, isActive, isConnecting, requestMicAccess]);

  const stopCall = useCallback(() => {
    try {
      vapiRef.current?.stop?.();
    } catch {
      /* noop */
    }
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const toggleCall = useCallback(() => {
    if (isActive) stopCall();
    else void startCall();
  }, [isActive, startCall, stopCall]);

  const retry = useCallback(() => {
    clearError();
    void startCall();
  }, [clearError, startCall]);

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
        setError("Wake-word listening isn't supported in this browser. Try Chrome.");
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
            setMicPermission("denied");
            setNeedsMic(true);
            setError("Microphone access denied. Allow the mic to enable wake-word.");
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
        clearError();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start wake-word listener.");
      }
    },
    [clearError, startCall],
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
      isConnecting,
      error,
      needsMic,
      micPermission,
      isConfigured: configured,
      wakeListening,
      wakeSupported,
      startCall,
      stopCall,
      toggleCall,
      retry,
      requestMicAccess,
      clearError,
      setWakeListening,
    }),
    [
      isActive,
      isConnecting,
      error,
      needsMic,
      micPermission,
      configured,
      wakeListening,
      wakeSupported,
      startCall,
      stopCall,
      toggleCall,
      retry,
      requestMicAccess,
      clearError,
      setWakeListening,
    ],
  );

  return <VapiContext.Provider value={value}>{children}</VapiContext.Provider>;
}

export function useVapiContext() {
  const ctx = useContext(VapiContext);
  if (!ctx) throw new Error("useVapiContext must be used within VapiProvider");
  return ctx;
}
