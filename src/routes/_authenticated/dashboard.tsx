import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogOut, Shield, Car, User as UserIcon, MapPin, Calendar, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ONE WAY CAB" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Booking = {
  id: string;
  booking_ref: string;
  customer_name: string;
  phone: string;
  pickup_city: string;
  drop_city: string;
  pickup_date: string;
  pickup_time: string | null;
  vehicle_name: string | null;
  estimated_fare: number | null;
  trip_type: string;
  status: string;
  driver_id: string | null;
  created_at: string;
};

function Dashboard() {
  const navigate = useNavigate();
  const { user, roles, loading, isAdmin, isDriver, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(true);

  const activeRole: "admin" | "driver" | "customer" = isAdmin ? "admin" : isDriver ? "driver" : "customer";

  useEffect(() => {
    if (loading || !user) return;
    setBusy(true);
    // RLS handles filtering: admin sees all, driver sees assigned, customer sees own
    supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setBookings((data ?? []) as Booking[]);
        setBusy(false);
      });
  }, [loading, user, activeRole]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold)]" />
      </div>
    );
  }

  const roleBadge = {
    admin: { label: "Admin", icon: Shield, color: "text-[color:var(--gold)]" },
    driver: { label: "Driver", icon: Car, color: "text-[color:var(--cyan)]" },
    customer: { label: "Customer", icon: UserIcon, color: "text-foreground" },
  }[activeRole];
  const RoleIcon = roleBadge.icon;

  const heading = {
    admin: "All bookings",
    driver: "Trips assigned to you",
    customer: "My bookings",
  }[activeRole];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg btn-gold text-sm font-bold">O</div>
            <span className="text-sm font-semibold tracking-wide">ONE WAY CAB</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs ${roleBadge.color}`}>
              <RoleIcon className="h-3.5 w-3.5" /> {roleBadge.label}
            </div>
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
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeRole === "admin" && "Every booking placed on the platform."}
          {activeRole === "driver" && "Trips an admin has assigned to you."}
          {activeRole === "customer" && "Trips you've booked with us."}
        </p>

        {roles.length === 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-muted-foreground">
            Your account has no role assigned yet. Contact support.
          </div>
        )}

        <div className="mt-6 space-y-3">
          {busy ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-[color:var(--gold)]" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
              {activeRole === "customer" ? (
                <>
                  No bookings yet.{" "}
                  <Link to="/" className="text-[color:var(--gold)] hover:underline">
                    Book your first trip →
                  </Link>
                </>
              ) : (
                "Nothing here yet."
              )}
            </div>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="glass rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-[color:var(--gold)]">{b.booking_ref}</span>
                      <span>·</span>
                      <span className="capitalize">{b.trip_type}</span>
                      <span>·</span>
                      <StatusPill status={b.status} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
                      <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
                      {b.pickup_city} → {b.drop_city}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {b.pickup_date} {b.pickup_time ?? ""}
                      </span>
                      {b.vehicle_name && <span>{b.vehicle_name}</span>}
                      {b.estimated_fare != null && (
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {Number(b.estimated_fare).toLocaleString("en-IN")}
                        </span>
                      )}
                      {activeRole !== "customer" && (
                        <span>· {b.customer_name} · {b.phone}</span>
                      )}
                    </div>
                  </div>

                  {(activeRole === "admin" || activeRole === "driver") && (
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
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-300",
    confirmed: "bg-cyan-500/15 text-cyan-300",
    "in-progress": "bg-blue-500/15 text-blue-300",
    completed: "bg-green-500/15 text-green-300",
    cancelled: "bg-red-500/15 text-red-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${styles[status] ?? "bg-white/10 text-muted-foreground"}`}>
      {status}
    </span>
  );
}
