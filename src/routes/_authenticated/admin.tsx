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

const BOOKING_STATUSES = ["all", "pending", "confirmed", "in-progress", "completed", "cancelled"] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBookingsCSV(rows: Booking[], driverMap: Map<string, string>) {
  const headers = [
    "Booking Ref", "Created At", "Status", "Payment", "Trip Type",
    "Customer", "Phone", "Email",
    "Pickup City", "Drop City", "Pickup Date", "Pickup Time",
    "Vehicle", "Distance (km)", "Estimated Fare (INR)",
    "Driver", "Notes",
  ];
  const lines = [headers.join(",")];
  for (const b of rows) {
    lines.push([
      b.booking_ref, b.created_at, b.status, b.payment_status, b.trip_type,
      b.customer_name, b.phone, b.email ?? "",
      b.pickup_city, b.drop_city, b.pickup_date, b.pickup_time ?? "",
      b.vehicle_name ?? "", b.distance_km ?? "", b.estimated_fare ?? "",
      b.driver_id ? driverMap.get(b.driver_id) ?? b.driver_id : "",
      b.notes ?? "",
    ].map(csvEscape).join(","));
  }
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BookingsPane() {
  const assign = useServerFn(assignBookingDriver);
  const [rows, setRows] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; email: string }[]>([]);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof BOOKING_STATUSES)[number]>("all");

  useEffect(() => {
    Promise.all([
      supabase
        .from("bookings")
        .select("id,booking_ref,customer_name,phone,email,pickup_city,drop_city,pickup_date,pickup_time,trip_type,vehicle_name,distance_km,status,payment_status,driver_id,estimated_fare,notes,created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("user_roles").select("user_id").eq("role", "driver"),
    ]).then(async ([bRes, dRes]) => {
      setRows((bRes.data ?? []) as Booking[]);
      const ids = (dRes.data ?? []).map((r) => r.user_id);
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

  const driverMap = new Map(drivers.map((d) => [d.id, d.email]));

  const filtered = rows.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      b.booking_ref.toLowerCase().includes(q) ||
      b.customer_name.toLowerCase().includes(q) ||
      b.phone.toLowerCase().includes(q) ||
      (b.email ?? "").toLowerCase().includes(q) ||
      b.pickup_city.toLowerCase().includes(q) ||
      b.drop_city.toLowerCase().includes(q)
    );
  });

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

  async function updatePayment(id: string, payment_status: string) {
    await supabase.from("bookings").update({ payment_status }).eq("id", id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, payment_status } : r)));
  }

  if (busy)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-[color:var(--gold)]" />
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ref, name, phone, city…"
            className="w-full rounded-full border border-white/10 bg-white/[0.04] px-9 py-2 text-xs outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs outline-none [color-scheme:dark]"
        >
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </div>
        <button
          onClick={() => downloadBookingsCSV(filtered, driverMap)}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full btn-gold px-4 py-2 text-xs font-semibold disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" /> Export Excel (CSV)
        </button>
      </div>

      {msg && <div className="rounded-xl bg-white/10 px-4 py-2 text-xs">{msg}</div>}

      {filtered.map((b) => (
        <div key={b.id} className="glass rounded-2xl p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-[color:var(--gold)]">{b.booking_ref}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">{b.trip_type}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">{b.status}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${b.payment_status === "paid" ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10"}`}>
                  {b.payment_status}
                </span>
                <span className="text-muted-foreground">
                  {new Date(b.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
              <div className="mt-2 text-base font-semibold">
                {b.pickup_city} → {b.drop_city}
              </div>
              <div className="mt-1 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <div><span className="text-foreground">Customer:</span> {b.customer_name}</div>
                <div><span className="text-foreground">Phone:</span> <a href={`tel:${b.phone}`} className="text-[color:var(--cyan)] hover:underline">{b.phone}</a></div>
                {b.email && <div><span className="text-foreground">Email:</span> {b.email}</div>}
                <div><span className="text-foreground">Pickup:</span> {b.pickup_date}{b.pickup_time ? ` · ${b.pickup_time}` : ""}</div>
                {b.vehicle_name && <div><span className="text-foreground">Vehicle:</span> {b.vehicle_name}</div>}
                {b.distance_km != null && <div><span className="text-foreground">Distance:</span> {b.distance_km} km</div>}
                <div><span className="text-foreground">Fare:</span> ₹{b.estimated_fare?.toLocaleString("en-IN") ?? "-"}</div>
                {b.driver_id && <div><span className="text-foreground">Driver:</span> {driverMap.get(b.driver_id) ?? b.driver_id.slice(0, 8)}</div>}
              </div>
              {b.notes && (
                <div className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Notes: </span>{b.notes}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <select
                value={b.driver_id ?? ""}
                onChange={(e) => onAssign(b.id, e.target.value || null)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs outline-none [color-scheme:dark]"
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.email}</option>
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
              <select
                value={b.payment_status}
                onChange={(e) => updatePayment(b.id, e.target.value)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs outline-none [color-scheme:dark]"
              >
                <option value="unpaid">unpaid</option>
                <option value="paid">paid</option>
                <option value="refunded">refunded</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "No bookings yet." : "No bookings match your filters."}
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
