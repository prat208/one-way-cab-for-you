import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, KeyRound, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — ONE WAY CAB" },
      { name: "description", content: "Sign in to ONE WAY CAB with Google or a one-time email code." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Step = "email" | "code";

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (err) throw err;
      setStep("code");
      setInfo("We sent a 6-digit code to your email. Enter it below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (err) throw err;
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setError(null);
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,200,61,0.08),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glow-ring rounded-3xl p-6 sm:p-8"
        >
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--gold)]">
            Welcome
          </div>
          <h1 className="mt-1 text-2xl font-semibold">Sign in to ONE WAY CAB</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No passwords. Continue with Google or get a one-time code by email.
          </p>

          <button
            type="button"
            onClick={googleSignIn}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-white/90 disabled:opacity-60"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" /> or email code <div className="h-px flex-1 bg-white/10" />
          </div>

          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-3">
              <AuthField icon={<Mail className="h-4 w-4 text-[color:var(--gold)]" />} label="Email">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="you@example.com"
                  autoFocus
                />
              </AuthField>
              {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
              <button
                type="submit"
                disabled={busy || !email}
                className="flex w-full items-center justify-center gap-2 rounded-full btn-gold px-6 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Send code <ArrowRight className="h-4 w-4" /></>)}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Code sent to <span className="text-foreground">{email}</span>
              </div>
              <AuthField icon={<KeyRound className="h-4 w-4 text-[color:var(--cyan)]" />} label="6-digit code">
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent text-lg tracking-[0.4em] outline-none"
                  placeholder="••••••"
                  autoFocus
                />
              </AuthField>
              {info && <p className="text-xs text-[color:var(--cyan)]">{info}</p>}
              {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
              <button
                type="submit"
                disabled={busy || code.length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-full btn-gold px-6 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setCode(""); setError(null); setInfo(null); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms & Privacy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function AuthField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors focus-within:border-[color:var(--gold)]/50">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
