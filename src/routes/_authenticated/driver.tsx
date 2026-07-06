import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Car, Loader2, LogOut, MapPin, PlusCircle, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/driver")({
  head: () => ({
    meta: [{ title: "Driver hub — ONE WAY CAB" }, { name: "robots", content: "noindex" }],
  }),
  component: DriverHub,
});

type Trip = {
  id: string;
  booking_ref: string;
  pickup_city: string;
  drop_city: string;
  pickup_date: string;
  pickup_time: string | null;
  status: string;
  estimated_fare: number | null;
  customer_name: string;
  phone: string;
};

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  plate: string;
  seats: number;
  category: string;
  color: string | null;
  license_number: string | null;
  status: string;
  notes: string | null;
};

function DriverHub() {
  const navigate = useNavigate();
  const { user, roles, isDriver, isAdmin, loading, signOut } = useAuth();
  const [tab, setTab] = useState<"trips" | "cabs">("trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cabs, setCabs] = useState<Vehicle[]>([]);
  const [busy, setBusy] = useState(true);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    setBusy(true);
    Promise.all([
      supabase
        .from("bookings")
        .select("id,booking_ref,pickup_city,drop_city,pickup_date,pickup_time,status,estimated_fare,customer_name,phone")
        .eq("driver_id", user.id)
        .order("pickup_date", { ascending: false })
        .limit(50),
      supabase
        .from("driver_vehicles")
        .select("*")
        .eq("driver_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("is_online").eq("id", user.id).maybeSingle(),
    ]).then(([tRes, vRes, pRes]) => {
      setTrips((tRes.data ?? []) as Trip[]);
      setCabs((vRes.data ?? []) as Vehicle[]);
      setOnline(Boolean(pRes.data?.is_online));
      setBusy(false);
    });
  }, [loading, user]);

  async function toggleOnline() {
    if (!user) return;
    const next = !online;
    setOnline(next);
    await supabase.from("profiles").update({ is_online: next }).eq("id", user.id);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--cyan)]" />
      </div>
    );
  }

  if (!isDriver && !isAdmin) {
    return (
      <div className="min-h-screen bg-background px-4 py-20 text-center text-foreground">
        <h1 className="text-xl font-semibold">Driver access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account role is {roles.join(", ") || "customer"}. Register as a driver to access this page.
        </p>
        <Link
          to="/driver/signup"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--cyan)] px-4 py-2 text-xs font-semibold text-black"
        >
          Driver signup
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg btn-gold text-sm font-bold">O</div>
            <span className="text-sm font-semibold">ONE WAY CAB</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleOnline}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${online ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-muted-foreground"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-muted-foreground"}`} />
              {online ? "Online" : "Offline"}
            </button>
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs hover:bg-white/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("trips")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${tab === "trips" ? "btn-gold" : "glass hover:bg-white/10"}`}
          >
            My trips
          </button>
          <button
            onClick={() => setTab("cabs")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${tab === "cabs" ? "btn-gold" : "glass hover:bg-white/10"}`}
          >
            My cabs
          </button>
        </div>

        {busy ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-[color:var(--cyan)]" />
          </div>
        ) : tab === "trips" ? (
          <div className="mt-6 space-y-3">
            {trips.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
                No trips assigned yet.
              </p>
            ) : (
              trips.map((t) => (
                <div key={t.id} className="glass rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono text-[color:var(--gold)]">{t.booking_ref}</span> · {t.customer_name} · {t.phone}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
                        <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
                        {t.pickup_city} → {t.drop_city}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t.pickup_date} {t.pickup_time ?? ""}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 uppercase tracking-widest">
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <select
                      value={t.status}
                      onChange={(e) => updateStatus(t.id, e.target.value)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs outline-none [color-scheme:dark]"
                    >
                      <option value="confirmed">confirmed</option>
                      <option value="in-progress">in-progress</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <CabsTab cabs={cabs} onChanged={(next) => setCabs(next)} userId={user!.id} />
        )}
      </main>
    </div>
  );
}

function CabsTab({
  cabs,
  onChanged,
  userId,
}: {
  cabs: Vehicle[];
  onChanged: (v: Vehicle[]) => void;
  userId: string;
}) {
  const [showForm, setShowForm] = useState(cabs.length === 0);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    plate: "",
    seats: "4",
    category: "sedan",
    color: "",
    license_number: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error } = await supabase
      .from("driver_vehicles")
      .insert({
        driver_id: userId,
        make: form.make,
        model: form.model,
        year: form.year ? Number(form.year) : null,
        plate: form.plate.toUpperCase(),
        seats: Number(form.seats),
        category: form.category,
        color: form.color || null,
        license_number: form.license_number || null,
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged([data as Vehicle, ...cabs]);
    setShowForm(false);
    setForm({ make: "", model: "", year: "", plate: "", seats: "4", category: "sedan", color: "", license_number: "" });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add a cab. Admin will review and approve it before it can accept trips.
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-full btn-gold px-3 py-1.5 text-xs font-semibold"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          {showForm ? "Close" : "Add cab"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="glass grid grid-cols-2 gap-3 rounded-2xl p-4">
          <Input label="Make" value={form.make} onChange={(v) => setForm({ ...form, make: v })} required />
          <Input label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} required />
          <Input label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
          <Input label="Plate" value={form.plate} onChange={(v) => setForm({ ...form, plate: v })} required />
          <Input label="Seats" value={form.seats} onChange={(v) => setForm({ ...form, seats: v })} />
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none [color-scheme:dark]"
            >
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="premium">Premium</option>
              <option value="tempo">Tempo Traveller</option>
            </select>
          </div>
          <Input label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
          <div className="col-span-2">
            <Input label="Driving licence #" value={form.license_number} onChange={(v) => setForm({ ...form, license_number: v })} />
          </div>
          {error && <p className="col-span-2 text-xs text-red-400">{error}</p>}
          <button
            disabled={busy}
            className="col-span-2 rounded-xl btn-gold py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      )}

      {cabs.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
          No cabs yet. Add one above.
        </p>
      ) : (
        cabs.map((c) => (
          <div key={c.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-[color:var(--cyan)]" />
              <div>
                <div className="text-sm font-semibold">
                  {c.make} {c.model} {c.year ? `· ${c.year}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.plate} · {c.seats} seats · {c.category}
                  {c.color ? ` · ${c.color}` : ""}
                </div>
              </div>
            </div>
            <StatusPill status={c.status} />
          </div>
        ))
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-300",
    approved: "bg-emerald-500/15 text-emerald-300",
    rejected: "bg-red-500/15 text-red-300",
    inactive: "bg-white/10 text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${styles[status] ?? "bg-white/10"}`}
    >
      {status}
    </span>
  );
}
