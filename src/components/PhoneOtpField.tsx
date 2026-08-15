import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { confirmPhoneOtp, requestPhoneOtp } from "@/lib/phone-verification.functions";

export type VerifiedPhone = { challengeId: string; draftKey: string };

export function PhoneOtpField({
  label,
  phone,
  purpose,
  draftKey,
  onVerified,
}: {
  label: string;
  phone: string;
  purpose: "requester" | "hospital";
  draftKey?: string;
  onVerified: (value: VerifiedPhone) => void;
}) {
  const requestOtp = useServerFn(requestPhoneOtp);
  const verifyOtp = useServerFn(confirmPhoneOtp);
  const [challenge, setChallenge] = useState<{ id: string; draftKey: string; masked: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const send = useMutation({
    mutationFn: () => requestOtp({ data: { phone, purpose, draftKey } }),
    onSuccess: (data) => {
      setChallenge({ id: data.id, draftKey: data.draft_key, masked: data.masked_phone });
      setOtp("");
      setVerified(false);
    },
  });
  const confirm = useMutation({
    mutationFn: () => {
      if (!challenge) throw new Error("Request a code first.");
      return verifyOtp({ data: { challengeId: challenge.id, draftKey: challenge.draftKey, otp } });
    },
    onSuccess: () => {
      if (!challenge) return;
      setVerified(true);
      onVerified({ challengeId: challenge.id, draftKey: challenge.draftKey });
    },
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-white/45">{label}</span>
        {verified && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
      </div>
      {!challenge ? (
        <button type="button" disabled={send.isPending || phone.length < 10} onClick={() => send.mutate()} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs disabled:opacity-40">
          {send.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Send OTP
        </button>
      ) : !verified ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder={`Code sent to ${challenge.masked}`} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs" />
          <button type="button" disabled={confirm.isPending || otp.length !== 6} onClick={() => confirm.mutate()} className="rounded-lg bg-primary px-3 py-1.5 text-xs disabled:opacity-40">Verify</button>
        </div>
      ) : null}
      {(send.isError || confirm.isError) && <p className="mt-2 text-[10px] text-destructive">{(send.error ?? confirm.error)?.message}</p>}
    </div>
  );
}