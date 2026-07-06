import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, IndianRupee, Loader2, MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/track/$ref")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Track ${params.ref} — ONE WAY CAB` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Track,
});

type LookupRow = {
  booking_ref: string;
  status: string;
  pickup_city: string;
  drop_city: string;
  pickup_date: string;
  pickup_time: string | null;
  vehicle_name: string | null;
  trip_type: string;
};

function Track() {
  const { ref } = Route.useParams();
  const [row, setRow] = useState<LookupRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(ref);

  useEffect(() => {
    setLoading(true);
    supabase
      .rpc("lookup_booking", { _ref: ref })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRow((data?.[0] as LookupRow) ?? null);
        setLoading(false);
      });
  }, [ref]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Home
        </Link>

        <h1 className="text-2xl font-semibold">Track your booking</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/track/${q.trim().toUpperCase()}`;
          }}
          className="mt-4 flex gap-2"
        >
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="OWC-XXXXXXXX"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <button className="rounded-xl btn-gold px-4 text-sm font-semibold">Track</button>
        </form>

        <div className="mt-6">
          {loading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-[color:var(--gold)]" />
            </div>
          ) : error ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
              {error}
            </p>
          ) : !row ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">
              No booking found for <span className="font-mono text-[color:var(--gold)]">{ref}</span>. Double-check the reference and try again.
            </p>
          ) : (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-[color:var(--gold)]">{row.booking_ref}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                  {row.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
                {row.pickup_city} → {row.drop_city}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {row.pickup_date} {row.pickup_time ?? ""}
                </span>
                {row.vehicle_name && <span>{row.vehicle_name}</span>}
                <span className="capitalize">{row.trip_type}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
