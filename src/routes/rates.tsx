import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Sections";
import { Loader2, MapPin, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title: "Fare Calculator & Rate Card — ONE WAY CAB" },
      { name: "description", content: "Live fare calculator for any Maharashtra route. Fixed rates for 9 popular routes, per-km pricing for all others. Sedan, Ertiga, Innova, Kia & Mini Bus." },
      { property: "og:title", content: "Fare Calculator — ONE WAY CAB" },
      { property: "og:description", content: "Estimate outstation cab fare across Maharashtra instantly." },
      { property: "og:url", content: "https://one-way-cab-for-you.lovable.app/rates" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://one-way-cab-for-you.lovable.app/rates" }],
  }),
  component: RatesPage,
});

type VehicleKey = "sedan" | "ertiga" | "kia" | "innova" | "minibus_nonac" | "minibus_ac";

const PER_KM: Record<VehicleKey, number | null> = {
  sedan: 13,
  ertiga: 16,
  kia: null, // fixed-route only
  innova: null, // fixed-route only
  minibus_nonac: 23,
  minibus_ac: 26,
};

const VEHICLE_META: Record<VehicleKey, { name: string; capacity: string }> = {
  sedan: { name: "Sedan", capacity: "4 Seater" },
  ertiga: { name: "Ertiga", capacity: "7 Seater" },
  kia: { name: "Kia Carens", capacity: "6 Seater" },
  innova: { name: "Innova Crysta", capacity: "7 Seater" },
  minibus_nonac: { name: "Mini Bus (Non-AC)", capacity: "17 Seater" },
  minibus_ac: { name: "Mini Bus (AC)", capacity: "17 Seater" },
};

type FixedRoute = {
  from: string;
  to: string;
  sedan: number;
  ertiga: number;
  kia: number;
  innova: number;
};

const FIXED_ROUTES: FixedRoute[] = [
  { from: "Kolhapur", to: "Pune", sedan: 3500, ertiga: 4500, kia: 5500, innova: 6500 },
  { from: "Kolhapur", to: "Mumbai", sedan: 6000, ertiga: 7000, kia: 9000, innova: 11000 },
  { from: "Kolhapur", to: "Goa", sedan: 3500, ertiga: 4500, kia: 5500, innova: 6500 },
  { from: "Mumbai", to: "Goa", sedan: 9500, ertiga: 11500, kia: 14000, innova: 16500 },
  { from: "Pune", to: "Goa", sedan: 7000, ertiga: 9000, kia: 11000, innova: 13500 },
  { from: "Kolhapur", to: "Solapur", sedan: 3500, ertiga: 4500, kia: 5500, innova: 7000 },
  { from: "Sangli", to: "Mumbai", sedan: 6000, ertiga: 7000, kia: 9000, innova: 11000 },
  { from: "Sangli", to: "Pune", sedan: 3500, ertiga: 4500, kia: 5500, innova: 6500 },
  { from: "Pune", to: "Mumbai", sedan: 2500, ertiga: 3000, kia: 3500, innova: 4500 },
];

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function findFixed(from: string, to: string): FixedRoute | null {
  const a = norm(from);
  const b = norm(to);
  return (
    FIXED_ROUTES.find(
      (r) =>
        (norm(r.from) === a && norm(r.to) === b) ||
        (norm(r.from) === b && norm(r.to) === a),
    ) ?? null
  );
}

async function geocode(q: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + ", India")}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) return null;
  const j = (await r.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!j.length) return null;
  return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon), label: j[0].display_name };
}

async function routeDistanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): Promise<number | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = (await r.json()) as { routes?: Array<{ distance: number }> };
  const meters = j.routes?.[0]?.distance;
  if (!meters) return null;
  return meters / 1000;
}

type Result =
  | {
      kind: "fixed";
      from: string;
      to: string;
      distanceKm: number | null;
      fares: { sedan: number; ertiga: number; kia: number; innova: number };
    }
  | {
      kind: "perkm";
      from: string;
      to: string;
      distanceKm: number;
      fares: Record<VehicleKey, number | null>;
    };

function RatesPage() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!pickup.trim() || !drop.trim()) {
      setError("Please enter pickup and drop locations.");
      return;
    }
    setLoading(true);
    try {
      const fixed = findFixed(pickup, drop);
      if (fixed) {
        setResult({
          kind: "fixed",
          from: fixed.from,
          to: fixed.to,
          distanceKm: null,
          fares: { sedan: fixed.sedan, ertiga: fixed.ertiga, kia: fixed.kia, innova: fixed.innova },
        });
        return;
      }
      const [a, b] = await Promise.all([geocode(pickup), geocode(drop)]);
      if (!a || !b) {
        setError("Could not find one of the locations. Try a nearby city name.");
        return;
      }
      const km = await routeDistanceKm(a, b);
      if (!km) {
        setError("Could not calculate a driving distance. Try again in a moment.");
        return;
      }
      const rounded = Math.round(km);
      const fares: Record<VehicleKey, number | null> = {
        sedan: Math.round(rounded * (PER_KM.sedan as number)),
        ertiga: Math.round(rounded * (PER_KM.ertiga as number)),
        kia: null,
        innova: null,
        minibus_nonac: Math.round(rounded * (PER_KM.minibus_nonac as number)),
        minibus_ac: Math.round(rounded * (PER_KM.minibus_ac as number)),
      };
      setResult({ kind: "perkm", from: pickup, to: drop, distanceKm: rounded, fares });
    } catch {
      setError("Something went wrong while calculating. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6 sm:pt-28">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--gold)]">
            Rate card & calculator
          </div>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Instant Maharashtra Fare Calculator</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Fixed prices apply to our 9 popular routes. Any other location is priced by driving
            distance × per-km rate. Toll, parking, state tax and driver allowance are extra.
          </p>
        </header>

        {/* Calculator */}
        <section className="glass rounded-2xl p-5 sm:p-6">
          <form onSubmit={calculate} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Pickup</span>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
                <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
                <input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="e.g. Kolhapur"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Drop</span>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
                <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
                <input
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  placeholder="e.g. Mahabaleshwar"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold self-end rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Get fare
                </span>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{result.from}</span>
                <ArrowRight className="h-4 w-4 text-[color:var(--gold)]" />
                <span className="font-medium">{result.to}</span>
                {result.kind === "fixed" ? (
                  <span className="ml-2 rounded-full bg-[color:var(--gold)]/15 px-2.5 py-0.5 text-xs text-[color:var(--gold)]">
                    Fixed route
                  </span>
                ) : (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ~{result.distanceKm} km driving distance
                  </span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(VEHICLE_META) as VehicleKey[]).map((k) => {
                  const fare =
                    result.kind === "fixed"
                      ? (k === "sedan" || k === "ertiga" || k === "kia" || k === "innova"
                          ? result.fares[k as "sedan" | "ertiga" | "kia" | "innova"]
                          : null)
                      : result.fares[k];
                  return (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                    >
                      <div>
                        <div className="text-sm font-medium">{VEHICLE_META[k].name}</div>
                        <div className="text-[11px] text-muted-foreground">{VEHICLE_META[k].capacity}</div>
                      </div>
                      <div className="text-right">
                        {fare == null ? (
                          <span className="text-xs text-muted-foreground">On request</span>
                        ) : (
                          <span className="text-base font-semibold text-[color:var(--gold)]">
                            ₹{fare.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Toll, parking, state tax and driver allowance extra where applicable.
              </p>
            </div>
          )}
        </section>

        {/* Fixed route table */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Fixed route prices</h2>
          <p className="text-sm text-muted-foreground">One-way fares for popular routes.</p>
          <div className="mt-4 overflow-x-auto rounded-2xl glass">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Sedan</th>
                  <th className="px-4 py-3">Ertiga</th>
                  <th className="px-4 py-3">Kia</th>
                  <th className="px-4 py-3">Innova</th>
                </tr>
              </thead>
              <tbody>
                {FIXED_ROUTES.map((r) => (
                  <tr key={`${r.from}-${r.to}`} className="border-t border-white/5">
                    <td className="px-4 py-3 font-medium">
                      {r.from} → {r.to}
                    </td>
                    <td className="px-4 py-3">₹{r.sedan.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">₹{r.ertiga.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">₹{r.kia.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">₹{r.innova.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Per-km rates */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Per-kilometre rates</h2>
          <p className="text-sm text-muted-foreground">
            Applied to any Maharashtra destination not listed above.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Sedan", "4 Seater", 13],
              ["Ertiga", "7 Seater", 16],
              ["Mini Bus (Non-AC)", "17 Seater", 23],
              ["Mini Bus (AC)", "17 Seater", 26],
            ] as const).map(([name, cap, rate]) => (
              <div key={name} className="glass rounded-xl p-4">
                <div className="text-sm font-medium">{name}</div>
                <div className="text-xs text-muted-foreground">{cap}</div>
                <div className="mt-2 text-2xl font-bold text-[color:var(--gold)]">₹{rate}<span className="text-sm font-normal text-muted-foreground">/km</span></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Estimated Fare = Total Distance (km) × Vehicle Rate per km. Distance is computed on the
            driving route between the two locations.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
