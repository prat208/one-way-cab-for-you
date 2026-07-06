import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Car, Loader2 } from "lucide-react";

export const Route = createFileRoute("/driver/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Drive with us — ONE WAY CAB" },
      {
        name: "description",
        content:
          "Register as a driver, add your cab, and start receiving outstation trips across Maharashtra and Goa.",
      },
    ],
  }),
  component: DriverSignup,
});

function DriverSignup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/driver" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/driver`,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            requested_role: "driver",
          },
        },
      });
      if (err) throw err;
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) navigate({ to: "/driver" });
      else setInfo("Check your inbox to confirm your email, then sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(0,212,255,0.08),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-[color:var(--cyan)]">
            <Car className="h-5 w-5" />
            <span className="text-xs uppercase tracking-widest">Driver signup</span>
          </div>
          <h1 className="text-2xl font-semibold">Drive with ONE WAY CAB</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your driver account. Add your cab on the next step — an admin
            will review and approve it.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Full name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Phone (WhatsApp)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Password (8+ chars)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            {info && <p className="text-xs text-emerald-400">{info}</p>}
            <button
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--cyan)] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create driver account"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already a driver?{" "}
            <Link to="/auth" className="text-[color:var(--cyan)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
