import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { SubPage } from "@/components/SubPage";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : "/donor-dashboard",
  }),
  head: () => ({
    meta: [
      { title: "Sign in · Sanjeevani X" },
      {
        name: "description",
        content:
          "Sign in to Sanjeevani X to complete donor health screening, track emergency blood requests and manage appointments.",
      },
      { property: "og:title", content: "Sign in · Sanjeevani X" },
      {
        property: "og:description",
        content: "Secure access to donor screening and emergency blood dispatch.",
      },
    ],
  }),
  component: AuthPage,
});

function safePath(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/donor-dashboard";
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.invalidate();
      void navigate({ to: safePath(next) });
    }
  }, [loading, user, navigate, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(safePath(next))}`,
            data: { full_name: fullName },
          },
        });
        if (err) throw err;
        setNotice("Account created. If email confirmation is on, check your inbox to finish.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      sessionStorage.setItem("sx_auth_next", safePath(next));
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("Google sign-in failed. Please try again or use email.");
        return;
      }
      if (result.redirected) return;
      void navigate({ to: safePath(next) });
    } catch {
      setError("Google sign-in failed. Please try again or use email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubPage
      tag="Secure access"
      title={
        <>
          Sign in to <span className="text-gradient-red">Sanjeevani X</span>
        </>
      }
      subtitle="Your health screening, appointments and emergency requests stay private to your account."
    >
      <div className="max-w-md mx-auto glass rounded-2xl p-6">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-5">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 text-xs py-2 rounded-lg transition ${
                mode === m ? "bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white" : "text-white/60"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2.5 text-sm transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6.2A5.3 5.3 0 0 1 12 18.5v3h.1c3.2 0 5.9-1.1 7.8-3 1.9-1.9 3.1-4.7 3.1-8.3z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7A6.6 6.6 0 0 1 5.6 14H2.4v3.3A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.6 14a6.6 6.6 0 0 1 0-4.2V6.5H2.4a11 11 0 0 0 0 9.8L5.6 14z" />
            <path fill="#EA4335" d="M12 5.4c1.8 0 3.3.6 4.5 1.8l3.1-3.1A11 11 0 0 0 2.4 6.5l3.2 3.3A6.6 6.6 0 0 1 12 5.4z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5 text-[10px] uppercase tracking-wider text-white/30">
          <div className="h-px flex-1 bg-white/10" /> or email <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              maxLength={80}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D6D]/50"
            />
          )}
          <div className="relative">
            <Mail className="w-4 h-4 text-white/30 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#FF4D6D]/50"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-white/30 absolute left-3 top-3" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#FF4D6D]/50"
            />
          </div>

          {error && <p className="text-xs text-[#FF4D6D]">{error}</p>}
          {notice && <p className="text-xs text-emerald-400">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-[#FF4D6D] to-[#E63946] py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="flex items-start gap-2 text-[11px] text-white/40 mt-5">
          <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
          Health answers and contact details are stored privately and are visible only to you.
        </p>
      </div>
    </SubPage>
  );
}
