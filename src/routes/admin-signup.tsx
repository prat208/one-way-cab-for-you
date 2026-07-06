import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminWithPasscode } from "@/lib/admin.functions";
import { ArrowLeft, KeyRound, Loader2, Shield } from "lucide-react";

export const Route = createFileRoute("/admin-signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin access — ONE WAY CAB" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSignup,
});

function AdminSignup() {
  const navigate = useNavigate();
  const claim = useServerFn(claimAdminWithPasscode);
  const [passcode, setPasscode] = useState("");
  const [needsSignin, setNeedsSignin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setNeedsSignin(!data.session);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await claim({ data: { passcode: passcode.trim() } });
      if (!res.ok) {
        setError(res.error ?? "Could not grant admin role");
      } else {
        setInfo("You now have admin access. Redirecting…");
        setTimeout(() => navigate({ to: "/dashboard" }), 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,200,61,0.10),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-[color:var(--gold)]">
            <Shield className="h-5 w-5" />
            <span className="text-xs uppercase tracking-widest">Admin access</span>
          </div>
          <h1 className="text-2xl font-semibold">Claim admin role</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in first, then enter your admin passcode below.
          </p>

          {needsSignin ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
              You're not signed in.{" "}
              <Link to="/auth" className="text-[color:var(--gold)] hover:underline">
                Sign in first →
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <label className="relative block">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  placeholder="Admin passcode"
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              {error && <p className="text-xs text-red-400">{error}</p>}
              {info && <p className="text-xs text-emerald-400">{info}</p>}
              <button
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl btn-gold px-4 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant admin access"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
