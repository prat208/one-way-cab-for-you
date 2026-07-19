import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminBell } from "@/components/admin/AdminBell";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  assignBookingDriver,
  setDriverVehicleStatus,
  setUserRole,
} from "@/lib/admin.functions";
import {
  Car,
  Check,
  Download,
  Loader2,
  LogOut,
  Search,
  Shield,
  UserPlus,
  UserMinus,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin console — ONE WAY CAB" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminConsole,
});

type Booking = {
  id: string;
  booking_ref: string;
  customer_name: string;
  phone: string;
  email: string | null;
  pickup_city: string;
  drop_city: string;
  pickup_date: string;
  pickup_time: string | null;
  trip_type: string;
  vehicle_name: string | null;
  distance_km: number | null;
  status: string;
  payment_status: string;
  driver_id: string | null;
  estimated_fare: number | null;
  notes: string | null;
  created_at: string;
};
type DriverVehicle = {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  plate: string;
  status: string;
  category: string;
  seats: number;
  license_number: string | null;
  color: string | null;
};

function AdminConsole() {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [tab, setTab] = useState<"bookings" | "drivers" | "users">("bookings");

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold)]" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background px-4 py-20 text-center text-foreground">
        <Shield className="mx-auto h-8 w-8 text-[color:var(--gold)]" />
        <h1 className="mt-3 text-xl font-semibold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account doesn't have admin privileges.
        </p>
        <Link to="/admin-signup" className="mt-4 inline-block text-xs text-[color:var(--gold)] hover:underline">
          Have a passcode? Claim admin →
        </Link>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg btn-gold text-sm font-bold">O</div>
            <span className="text-sm font-semibold">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/admin/leads" className="rounded-full glass px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
              Leads
            </Link>
            <AdminBell />
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
          {(["bookings", "drivers", "users"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${tab === t ? "btn-gold" : "glass hover:bg-white/10"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {tab === "bookings" && <BookingsPane />}
          {tab === "drivers" && <DriversPane />}
          {tab === "users" && <UsersPane />}
        </div>
      </main>
    </div>
  );
}

function BookingsPane() {
  const assign = useServerFn(assignBookingDriver);
  const [rows, setRows] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; email: string }[]>([]);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase
        .from("bookings")
        .select("id,booking_ref,customer_name,phone,pickup_city,drop_city,pickup_date,status,driver_id,estimated_fare")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("user_roles").select("user_id").eq("role", "driver"),
    ]).then(async ([bRes, dRes]) => {
      setRows((bRes.data ?? []) as Booking[]);
      const ids = (dRes.data ?? []).map((r) => r.user_id);
      // Fetch driver emails via profiles fallback
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        setDrivers(
          (profs ?? []).map((p) => ({ id: p.id, email: p.full_name ?? p.id.slice(0, 6) })),
        );
      }
      setBusy(false);
    });
  }, []);

  async function onAssign(booking_id: string, driver_id: string | null) {
    setMsg(null);
    try {
      await assign({ data: { booking_id, driver_id } });
      setRows((prev) =>
        prev.map((r) =>
          r.id === booking_id
            ? { ...r, driver_id, status: driver_id ? "confirmed" : "pending" }
            : r,
        ),
      );
      setMsg("Updated.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  if (busy)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-[color:var(--gold)]" />
      </div>
    );

  return (
    <div className="space-y-3">
      {msg && <div className="rounded-xl bg-white/10 px-4 py-2 text-xs">{msg}</div>}
      {rows.map((b) => (
        <div key={b.id} className="glass rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">
                <span className="font-mono text-[color:var(--gold)]">{b.booking_ref}</span> · {b.customer_name} · {b.phone}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {b.pickup_city} → {b.drop_city}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {b.pickup_date} · ₹{b.estimated_fare?.toLocaleString("en-IN") ?? "-"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={b.driver_id ?? ""}
                onChange={(e) => onAssign(b.id, e.target.value || null)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs outline-none [color-scheme:dark]"
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.email}
                  </option>
                ))}
              </select>
              <select
                value={b.status}
                onChange={(e) => updateStatus(b.id, e.target.value)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs outline-none [color-scheme:dark]"
              >
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="in-progress">in-progress</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
          No bookings yet.
        </p>
      )}
    </div>
  );
}

function DriversPane() {
  const setStatus = useServerFn(setDriverVehicleStatus);
  const [rows, setRows] = useState<DriverVehicle[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    supabase
      .from("driver_vehicles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as DriverVehicle[]);
        setBusy(false);
      });
  }, []);

  async function update(id: string, status: "approved" | "rejected" | "inactive" | "pending") {
    await setStatus({ data: { id, status } });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  if (busy)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-[color:var(--gold)]" />
      </div>
    );

  return (
    <div className="space-y-3">
      {rows.map((v) => (
        <div key={v.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-[color:var(--cyan)]" />
            <div>
              <div className="text-sm font-semibold">
                {v.make} {v.model} · {v.plate}
              </div>
              <div className="text-xs text-muted-foreground">
                {v.category} · {v.seats} seats {v.color ? `· ${v.color}` : ""} {v.license_number ? `· DL ${v.license_number}` : ""}
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">driver {v.driver_id.slice(0, 8)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">
              {v.status}
            </span>
            <button
              onClick={() => update(v.id, "approved")}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/30"
            >
              <Check className="h-3 w-3" /> Approve
            </button>
            <button
              onClick={() => update(v.id, "rejected")}
              className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-200 hover:bg-red-500/30"
            >
              <X className="h-3 w-3" /> Reject
            </button>
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
          No driver vehicle submissions yet.
        </p>
      )}
    </div>
  );
}

function UsersPane() {
  const change = useServerFn(setUserRole);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "driver" | "customer">("driver");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(action: "grant" | "revoke") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await change({ data: { email: email.trim(), role, action } });
      setMsg(res.ok ? `${action === "grant" ? "Granted" : "Revoked"} ${role} for ${email}` : res.error ?? "Failed");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass max-w-xl rounded-2xl p-6">
      <h2 className="text-sm font-semibold">Grant or revoke a role</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        The user must already have a ONE WAY CAB account.
      </p>
      <div className="mt-4 space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="user@example.com"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none [color-scheme:dark]"
        >
          <option value="admin">admin</option>
          <option value="driver">driver</option>
          <option value="customer">customer</option>
        </select>
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
        <div className="flex gap-2">
          <button
            disabled={busy || !email}
            onClick={() => act("grant")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl btn-gold px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" /> Grant
          </button>
          <button
            disabled={busy || !email}
            onClick={() => act("revoke")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl glass px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
          >
            <UserMinus className="h-4 w-4" /> Revoke
          </button>
        </div>
      </div>
    </div>
  );
}
