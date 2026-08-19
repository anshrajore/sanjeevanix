/**
 * In-memory diagnostics store for VAPI voice calls.
 *
 * Every call attempt is recorded with its loader stages (bundled SDK, CDN
 * fallback), the exact fallback reason, the real error message and — when the
 * browser gives us one — the full stack trace. The diagnostics panel reads
 * this store so operators can see precisely why a call failed.
 */

export type AttemptStage = {
  at: number;
  label: string;
  detail?: string;
  ok: boolean;
};

export type VapiAttempt = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  status: "connecting" | "active" | "ended" | "failed";
  trigger: "button" | "wake-word" | "retry";
  loaderSource: string | null;
  fallbackReason: string | null;
  error: string | null;
  stack: string | null;
  micPermission: string;
  stages: AttemptStage[];
  transcript: Array<{ at: number; role: string; text: string }>;
};

const MAX_ATTEMPTS = 20;
let attempts: VapiAttempt[] = [];
const listeners = new Set<(list: VapiAttempt[]) => void>();

function emit() {
  const snapshot = attempts.map((a) => ({ ...a }));
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeVapiAttempts(listener: (list: VapiAttempt[]) => void): () => void {
  listeners.add(listener);
  listener(attempts.map((a) => ({ ...a })));
  return () => listeners.delete(listener);
}

export function getVapiAttempts(): VapiAttempt[] {
  return attempts.map((a) => ({ ...a }));
}

export function startAttempt(trigger: VapiAttempt["trigger"], micPermission: string): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const fresh: VapiAttempt = {
      id,
      startedAt: Date.now(),
      endedAt: null,
      status: "connecting",
      trigger,
      loaderSource: null,
      fallbackReason: null,
      error: null,
      stack: null,
      micPermission,
      stages: [],
      transcript: [],
    },
    ...attempts,
  ].slice(0, MAX_ATTEMPTS);
  emit();
  return id;
}

function patch(id: string, updater: (attempt: VapiAttempt) => void) {
  const target = attempts.find((a) => a.id === id);
  if (!target) return;
  updater(target);
  emit();
}

export function logStage(id: string, label: string, ok: boolean, detail?: string) {
  patch(id, (a) => {
    a.stages.push({ at: Date.now(), label, ok, detail });
    if (ok && label.toLowerCase().includes("sdk")) a.loaderSource = label;
    if (!ok && !a.fallbackReason) a.fallbackReason = detail ? `${label}: ${detail}` : label;
  });
}

export function markActive(id: string) {
  patch(id, (a) => {
    a.status = "active";
  });
}

export function markEnded(id: string) {
  patch(id, (a) => {
    if (a.status === "failed") return;
    a.status = "ended";
    a.endedAt = Date.now();
  });
}

export function markFailed(id: string, error: unknown, message?: string) {
  patch(id, (a) => {
    a.status = "failed";
    a.endedAt = Date.now();
    a.error = message ?? (error instanceof Error ? error.message : String(error ?? "Unknown error"));
    a.stack = error instanceof Error && error.stack ? error.stack : null;
  });
}

export function addTranscript(id: string, role: string, text: string) {
  patch(id, (a) => {
    a.transcript.push({ at: Date.now(), role, text });
  });
}

export function getAttempt(id: string): VapiAttempt | null {
  const found = attempts.find((a) => a.id === id);
  return found ? { ...found } : null;
}

export function clearVapiAttempts() {
  attempts = [];
  emit();
}
