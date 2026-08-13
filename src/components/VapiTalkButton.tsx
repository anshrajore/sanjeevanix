import { AlertTriangle, Loader2, Mic, MicOff, PhoneOff, RotateCcw } from "lucide-react";

import { useVapi } from "@/hooks/use-vapi";
import { cn } from "@/lib/utils";

type VapiTalkButtonProps = {
  className?: string;
  children?: React.ReactNode;
  activeLabel?: string;
  inactiveLabel?: string;
  showError?: boolean;
};

/** Shared error card with a microphone prompt and a retry action. */
export function VapiErrorCard({ className }: { className?: string }) {
  const { error, needsMic, micPermission, requestMicAccess, retry, clearError } = useVapi();
  if (!error) return null;

  return (
    <div
      role="alert"
      className={cn(
        "glass rounded-xl border border-[#E63946]/40 bg-[#E63946]/10 p-3 text-left max-w-sm",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {needsMic ? (
          <MicOff className="w-4 h-4 text-[#FF4D6D] mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-[#FF4D6D] mt-0.5 shrink-0" />
        )}
        <div className="min-w-0">
          <div className="text-xs font-medium text-[#FF4D6D]">
            {needsMic ? "Microphone needed" : "Voice call failed"}
          </div>
          <p className="text-[11px] text-white/70 mt-1 leading-relaxed">{error}</p>
          {needsMic && micPermission === "denied" && (
            <p className="text-[10px] text-white/45 mt-1">
              Click the lock or mic icon in your browser's address bar → allow Microphone → then
              retry.
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {needsMic && (
              <button
                type="button"
                onClick={() => void requestMicAccess()}
                className="text-[11px] inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1.5 transition"
              >
                <Mic className="w-3 h-3" /> Allow microphone
              </button>
            )}
            <button
              type="button"
              onClick={retry}
              className="text-[11px] inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FF4D6D] to-[#E63946] px-2.5 py-1.5 text-white"
            >
              <RotateCcw className="w-3 h-3" /> Retry call
            </button>
            <button
              type="button"
              onClick={clearError}
              className="text-[11px] text-white/45 hover:text-white/70 px-1 py-1.5"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VapiTalkButton({
  className,
  children,
  activeLabel = "End call",
  inactiveLabel = "Talk to AI",
  showError = true,
}: VapiTalkButtonProps) {
  const { isActive, isConnecting, toggleCall } = useVapi();

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <button type="button" onClick={toggleCall} className={cn(className)} disabled={isConnecting}>
        {children ?? (
          <>
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              <PhoneOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}{" "}
            {isConnecting ? "Connecting…" : isActive ? activeLabel : inactiveLabel}
          </>
        )}
      </button>
      {showError && <VapiErrorCard />}
    </div>
  );
}

export function VapiMicOrb({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  const { isActive, isConnecting, toggleCall } = useVapi();
  const dim = size === "lg" ? "w-24 h-24" : "w-16 h-16";
  const icon = size === "lg" ? "w-10 h-10" : "w-7 h-7";

  return (
    <button
      type="button"
      onClick={toggleCall}
      aria-label={isActive ? "End voice call" : "Start voice call with Sanjeevani AI"}
      className={cn(
        dim,
        "rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#E63946] flex items-center justify-center glow-red hover:scale-110 transition-transform",
        (isActive || isConnecting) && "ring-4 ring-[#FF4D6D]/40 animate-pulse",
        className,
      )}
    >
      {isActive || isConnecting ? (
        <Loader2 className={cn(icon, "text-white animate-spin")} />
      ) : (
        <Mic className={cn(icon, "text-white")} />
      )}
    </button>
  );
}
