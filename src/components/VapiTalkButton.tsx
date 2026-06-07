import { Loader2, Mic, PhoneOff } from "lucide-react";
import { useVapi } from "@/hooks/use-vapi";
import { cn } from "@/lib/utils";

type VapiTalkButtonProps = {
  className?: string;
  children?: React.ReactNode;
  activeLabel?: string;
  inactiveLabel?: string;
  showError?: boolean;
};

export function VapiTalkButton({
  className,
  children,
  activeLabel = "End call",
  inactiveLabel = "Talk to AI",
  showError = true,
}: VapiTalkButtonProps) {
  const { isActive, error, toggleCall } = useVapi();

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button type="button" onClick={toggleCall} className={cn(className)}>
        {children ?? (
          <>
            {isActive ? <PhoneOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}{" "}
            {isActive ? activeLabel : inactiveLabel}
          </>
        )}
      </button>
      {showError && error && (
        <span className="text-xs text-red-400 max-w-xs text-center">{error}</span>
      )}
    </div>
  );
}

export function VapiMicOrb({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  const { isActive, toggleCall } = useVapi();
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
        isActive && "ring-4 ring-[#FF4D6D]/40 animate-pulse",
        className,
      )}
    >
      {isActive ? (
        <Loader2 className={cn(icon, "text-white animate-spin")} />
      ) : (
        <Mic className={cn(icon, "text-white")} />
      )}
    </button>
  );
}
