import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Clock, ShieldCheck, Star, Phone } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { BookingWidget } from "@/components/landing/BookingWidget";
import { Footer, FAQ } from "@/components/landing/Sections";
import { getCityPage, listCitySlugs } from "@/lib/booking.functions";

export const Route = createFileRoute("/city/$slug")({
  loader: async ({ params }) => {
    const data = await getCityPage({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "City not found — ONE WAY CAB" }] };
    const title = `${loaderData.name} Outstation Cabs — ONE WAY CAB`;
    const description = `Book premium outstation cabs from ${loaderData.name}. Transparent one-way fares, verified chauffeurs, 24×7 support. ${loaderData.routes.length}+ popular routes.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">We don't serve that city yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try{" "}
          {listCitySlugs().map((s, i) => (
            <span key={s}>
              {i > 0 && ", "}
              <Link to="/city/$slug" params={{ slug: s }} className="text-[color:var(--gold)] hover:underline capitalize">
                {s}
              </Link>
            </span>
          ))}
          .
        </p>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <p className="text-sm text-red-400">{error.message}</p>
    </div>
  ),
  component: CityPage,
});

function CityPage() {
  const city = Route.useLoaderData();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,200,61,0.10),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-16 sm:px-6 md:grid-cols-2 md:gap-14 md:pb-24">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              <MapPin className="h-3.5 w-3.5 text-[color:var(--gold)]" />
              {city.name}, {city.state}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-6xl"
            >
              Outstation cabs from{" "}
              <span className="text-gradient-gold">{city.name}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg"
            >
              {city.blurb}
            </motion.p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#book" className="rounded-full btn-gold px-6 py-3 text-sm font-semibold">
                Get instant fare
              </a>
              <a
                href="tel:+919999999999"
                className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-medium hover:bg-white/10"
              >
                <Phone className="h-4 w-4 text-[color:var(--cyan)]" /> Talk to us · 24×7
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {city.landmarks.map((l: string) => (
                <span key={l} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <BookingWidget initialPickup={city.name} />
          </div>
        </div>
      </section>

      {/* ROUTES */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--gold)]">Popular routes</div>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              From {city.name} to{" "}
              <span className="text-gradient-gold">anywhere you love</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Sedan one-way fares, indicative. SUV and Innova also available.
            </p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {city.routes.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground">
                Route data will appear here once loaded.
              </p>
            )}
            {city.routes.map((r: { to: string; distance_km: number; duration_hours: number; fare_from: number | null }) => (
              <a
                key={r.to}
                href="#book"
                className="glass group flex items-center justify-between rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className="text-xs text-muted-foreground">{city.name}</div>
                  <div className="flex items-center gap-1.5 text-base font-semibold">
                    <ArrowRight className="h-3.5 w-3.5 text-[color:var(--gold)]" /> {r.to}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{r.distance_km} km</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ~{r.duration_hours}h</span>
                  </div>
                </div>
                {r.fare_from != null && (
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">from</div>
                    <div className="text-base font-bold text-gradient-gold">
                      ₹{r.fare_from.toLocaleString("en-IN")}
                    </div>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="relative py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6">
          {[
            { icon: ShieldCheck, t: "Verified chauffeurs" },
            { icon: Star, t: "4.9 avg rating" },
            { icon: Clock, t: "97% on-time" },
            { icon: Phone, t: "24×7 helpline" },
          ].map((f) => (
            <div key={f.t} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
              <f.icon className="h-5 w-5 text-[color:var(--gold)]" />
              <span className="text-sm">{f.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Other cities */}
      <section className="relative py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center text-xs uppercase tracking-[0.22em] text-[color:var(--gold)]">
            Also serving
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {listCitySlugs()
              .filter((s) => s !== city.slug)
              .map((s) => (
                <Link
                  key={s}
                  to="/city/$slug"
                  params={{ slug: s }}
                  className="rounded-full glass px-4 py-2 text-sm capitalize hover:bg-white/10"
                >
                  Cabs from {s}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />
    </div>
  );
}
