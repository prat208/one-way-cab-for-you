import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Nav } from "@/components/landing/Nav";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { AssistantPanel } from "@/components/chat/AssistantPanel";
import { supabase } from "@/integrations/supabase/client";
import { getMyLead } from "@/lib/leads.functions";
import { MapPin, Calendar, IndianRupee, PlusCircle, Ticket, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/customer")({
  head: () => ({ meta: [{ title: "My rides — ONE WAY CAB" }, { name: "robots", content: "noindex" }] }),
  component: CustomerHub,
});

type Trip = {
  id: string; booking_ref: string; pickup_city: string; drop_city: string;
  pickup_date: string; pickup_time: string | null; vehicle_name: string | null;
  estimated_fare: number | null; status: string; trip_type: string;
};

function CustomerHub() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tab, setTab] = useState<"book" | "trips">("book");
  const fetchLead = useServerFn(getMyLead);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [hasLead, setHasLead] = useState<boolean | null>(null);

  useEffect(() => {
    fetchLead().then((r) => {
      setHasLead(Boolean(r.lead));
      setCouponCode(r.coupon?.code ?? null);
    }).catch(() => setHasLead(false));
    supabase.from("bookings").select("id,booking_ref,pickup_city,drop_city,pickup_date,pickup_time,vehicle_name,estimated_fare,status,trip_type")
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setTrips((data ?? []) as Trip[]));
  }, [fetchLead]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--gold)]">Customer hub</div>
            <h1 className="mt-1 text-3xl font-bold">Your rides, your way</h1>
          </div>
          <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
            <button onClick={() => setTab("book")} className={`rounded-full px-4 py-1.5 ${tab === "book" ? "bg-[color:var(--gold)]/15 text-[color:var(--gold)]" : "text-muted-foreground"}`}>Book new</button>
            <button onClick={() => setTab("trips")} className={`rounded-full px-4 py-1.5 ${tab === "trips" ? "bg-[color:var(--gold)]/15 text-[color:var(--gold)]" : "text-muted-foreground"}`}>My trips ({trips.length})</button>
          </div>
        </header>

        {tab === "book" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
            <BookingWizard />
            <AssistantPanel />
          </div>
        ) : (
          <div className="space-y-3">
            {trips.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
                No trips yet. <button onClick={() => setTab("book")} className="text-[color:var(--gold)] hover:underline">Book your first →</button>
              </div>
            ) : trips.map((t) => (
              <div key={t.id} className="glass rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-[color:var(--gold)]">{t.booking_ref}</span>
                      <span>·</span><span className="capitalize">{t.trip_type}</span>
                      <span>·</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">{t.status}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
                      <MapPin className="h-4 w-4 text-[color:var(--gold)]" /> {t.pickup_city} → {t.drop_city}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{t.pickup_date} {t.pickup_time ?? ""}</span>
                      {t.vehicle_name && <span>{t.vehicle_name}</span>}
                      {t.estimated_fare != null && (
                        <span className="inline-flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{Number(t.estimated_fare).toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </div>
                  <Link to="/book" search={{ pickup: t.pickup_city, drop: t.drop_city }} className="inline-flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs hover:bg-white/10">
                    <PlusCircle className="h-3.5 w-3.5" /> Rebook
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
