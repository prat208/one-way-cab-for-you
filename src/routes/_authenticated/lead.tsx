import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { submitLead, getMyLead } from "@/lib/leads.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/lead")({
  head: () => ({
    meta: [{ title: "Tell us about your trip — ONE WAY CAB" }],
  }),
  component: LeadPage,
});

function LeadPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const submit = useServerFn(submitLead);
  const fetchLead = useServerFn(getMyLead);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      email: user.email ?? "",
      name: (user.user_metadata?.full_name as string) ?? f.name,
      phone: (user.user_metadata?.phone as string) ?? f.phone,
    }));
    fetchLead()
      .then((r) => {
        if (r.lead && r.coupon) nav({ to: "/coupon" });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [user, fetchLead, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submit({ data: form });
      nav({ to: "/coupon" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-xs uppercase tracking-wider text-[color:var(--gold)]">Almost there</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Tell us a bit about you</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Takes 20 seconds. We'll unlock live fares and send you a discount coupon on the next screen.
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <Field label="Full name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Mobile number" required type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" required type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field label="State" required value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          </div>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Anything else? (optional)</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--gold)]/60"
              placeholder="Preferred contact time, trip idea, questions…"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--gold)] px-4 py-3 text-sm font-semibold text-[#2b2620] hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Get my coupon & unlock fares
          </button>
          <p className="text-center text-xs text-muted-foreground">
            No spam. Our team may call you to confirm your trip.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, required, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[color:var(--gold)]/60"
      />
    </label>
  );
}
