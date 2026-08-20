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
import {
  addTranscript,
  getAttempt,
  logStage,
  markActive,
  markEnded,
  markFailed,
  startAttempt,
} from "@/lib/vapi-diagnostics";
import { logVoiceCall } from "@/lib/voice-log.functions";

export type MicPermission = "unknown" | "prompt" | "granted" | "denied";
export type CallTrigger = "button" | "wake-word" | "retry";

/** Persists a finished attempt (transcript + failure reason) for admin audit. */
async function persistAttempt(attemptId: string) {
  const attempt = getAttempt(attemptId);
  if (!attempt) return;
  try {
    await logVoiceCall({
      data: {
        assistantId: VAPI_ASSISTANT_ID,
        outcome: attempt.status,
        startedAt: new Date(attempt.startedAt).toISOString(),
        endedAt: new Date(attempt.endedAt ?? Date.now()).toISOString(),
        durationSeconds: Math.round(((attempt.endedAt ?? Date.now()) - attempt.startedAt) / 1000),
        errorMessage: attempt.error ?? "",
        fallbackReason: attempt.fallbackReason ?? "",
        transcript: attempt.transcript,
        metadata: {
          trigger: attempt.trigger,
          loaderSource: attempt.loaderSource,
          micPermission: attempt.micPermission,
          stages: attempt.stages,
          stack: attempt.stack,
        },
      },
    });
  } catch {
    /* logging must never break a call */
  }
}

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
  const attemptRef = useRef<string | null>(null);
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

  /** Tears down any previous instance so every attempt starts from scratch. */
  const disposeVapi = useCallback(() => {
    const instance = vapiRef.current;
    vapiRef.current = null;
    if (!instance) return;
    try {
      instance.stop?.();
    } catch {
      /* noop */
    }
    try {
      instance.removeAllListeners?.();
    } catch {
      /* noop */
    }
  }, []);

  const startCall = useCallback(async (trigger: CallTrigger = "button") => {
    if (isConnecting || isActive) return;
    clearError();
    setIsConnecting(true);

    const attemptId = startAttempt(trigger, micPermission);
    attemptRef.current = attemptId;


    if (recogRef.current) {
      try {
        recogRef.current.stop?.();
      } catch {
        /* noop */
      }
      recogRef.current = null;
      setWakeListeningState(false);
    }

    const publicKey = getVapiPublicKey();
    if (!publicKey) {
      const message = "Voice AI key is missing. Set VITE_VAPI_PUBLIC_KEY to enable calls.";
      logStage(attemptId, "public key", false, message);
      markFailed(attemptId, null, message);
      fail(message);
      return;
    }
    logStage(attemptId, "public key", true, `${publicKey.slice(0, 8)}…`);

    const micOk = await requestMicAccess();
    logStage(attemptId, "microphone", micOk, micOk ? "granted" : "blocked or unavailable");
    if (!micOk) {
      markFailed(attemptId, null, "Microphone access was not granted.");
      return;
    }

    // A fresh instance per attempt: reusing a stopped/errored instance is why
    // calls previously worked only once.
    disposeVapi();

    let vapi;
    try {
      const { createVapiInstance } = await import("@/lib/vapi-loader");
      const loaded = await createVapiInstance(publicKey, (label, ok, detail) =>
        logStage(attemptId, label, ok, detail),
      );
      vapi = loaded.instance;
    } catch (e) {
      markFailed(attemptId, e, e instanceof Error ? e.message : "Voice engine failed to load.");
      fail(e instanceof Error ? e.message : "Voice engine failed to load.");
      void persistAttempt(attemptId);
      return;
    }

    vapi.on("call-start", () => {
      logStage(attemptId, "call-start", true);
      markActive(attemptId);
      setIsActive(true);
      setIsConnecting(false);
      clearError();
    });
    vapi.on("call-end", () => {
      logStage(attemptId, "call-end", true);
      markEnded(attemptId);
      setIsActive(false);
      setIsConnecting(false);
      disposeVapi();
      void persistAttempt(attemptId);
    });
    vapi.on("message", (msg: unknown) => {
      const m = msg as { type?: string; role?: string; transcript?: string; transcriptType?: string };
      if (m?.type === "transcript" && m.transcript && m.transcriptType !== "partial") {
        addTranscript(attemptId, m.role ?? "unknown", m.transcript);
      }
    });
    vapi.on("error", (e: unknown) => {
      const detail =
        typeof e === "string"
          ? e
          : ((e as { message?: string })?.message ??
            (e as { error?: { message?: string } })?.error?.message ??
            (e as { errorMsg?: string })?.errorMsg ??
            (() => {
              try {
                return JSON.stringify(e);
              } catch {
                return "";
              }
            })());
      disposeVapi();
      markFailed(attemptId, e, detail || "The voice call dropped. Please retry.");
      fail(detail || "The voice call dropped. Please retry.");
      void persistAttempt(attemptId);
    });
    vapiRef.current = vapi;

    try {
      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      disposeVapi();
      const message =
        err instanceof Error
          ? `Could not start the voice call — ${err.message}`
          : "Could not start the voice call. Please retry.";
      markFailed(attemptId, err, message);
      fail(message);
      void persistAttempt(attemptId);
    }
  }, [clearError, disposeVapi, fail, isActive, isConnecting, micPermission, requestMicAccess]);

  const stopCall = useCallback(() => {
    disposeVapi();
    setIsActive(false);
    setIsConnecting(false);
  }, [disposeVapi]);

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
