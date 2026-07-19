import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, Star, ArrowDown, PhoneCall } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { HeroScene, HeroCar } from "@/components/landing/HeroScene";
import { BookingWidget } from "@/components/landing/BookingWidget";
import {
  Services,
  Fleet,
  WhyUs,
  Process,
  PopularRoutes,
  Cities,
  Testimonials,
  FAQ,
  Footer,
  CareUSP,
} from "@/components/landing/Sections";
import { AuthLink } from "@/components/AuthLink";
import { BrandIntro } from "@/components/BrandIntro";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-gradient-gold sm:text-3xl">{v}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{l}</div>
    </div>
  );
}

function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <BrandIntro />
      <Nav />

      {/* HERO */}
      <section className="relative min-h-[100svh] w-full overflow-hidden pt-24">
        <HeroScene />
        <HeroCar />

        <div className="relative z-20 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-32 pt-6 sm:px-6 md:grid-cols-2 md:gap-12 md:pt-14">
          <div className="flex flex-col justify-start">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)]">★</span>
              Rated 4.9 by 12,400+ travellers
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Outstation cabs,
              <br />
              <span className="text-gradient-gold">reimagined premium.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg"
            >
              Door-to-door outstation rides from Pune, Mumbai, Kolhapur & Nashik. Transparent fares,
              verified chauffeurs, plush cars — booked in under a minute.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <AuthLink to="/book" className="rounded-full btn-gold px-6 py-3 text-sm font-semibold">
                Get instant fare
              </AuthLink>
              <AuthLink
                to="/book"
                className="rounded-full glass px-6 py-3 text-sm font-medium hover:bg-white/10"
              >
                Talk to us · 24×7
              </AuthLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[color:var(--cyan)]" /> Verified drivers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 text-[color:var(--gold)]" /> 4.9 avg rating
              </span>
              <span>· No hidden charges</span>
              <span>· Pay after ride</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="glass mt-10 grid max-w-lg grid-cols-3 gap-6 rounded-2xl px-5 py-4"
            >
              <Stat v="120k+" l="Rides" />
              <Stat v="4.9★" l="Rating" />
              <Stat v="97%" l="On-time" />
            </motion.div>
          </div>

          <div className="flex justify-center md:justify-end">
            <BookingWidget />
          </div>
        </div>

        {/* Scroll cue */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center text-muted-foreground">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center text-[10px] uppercase tracking-[0.2em]"
          >
            Scroll <ArrowDown className="mt-1 h-4 w-4" />
          </motion.div>
        </div>
      </section>

      <Services />
      <CareUSP />
      <Fleet />
      <WhyUs />
      <Process />

      <PopularRoutes />
      <Cities />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
