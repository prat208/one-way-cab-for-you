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
  head: () => ({
    meta: [
      { title: "ONE WAY CAB — Premium Outstation Cabs in Maharashtra" },
      {
        name: "description",
        content:
          "Outstation, one-way and round-trip cabs across Maharashtra. Live fares, verified chauffeurs, 24×7 support and instant WhatsApp booking.",
      },
      { property: "og:title", content: "ONE WAY CAB — Premium Outstation Cabs in Maharashtra" },
      {
        property: "og:description",
        content:
          "Outstation, one-way and round-trip cabs across Maharashtra. Live fares, verified chauffeurs, 24×7 support.",
      },
      { property: "og:url", content: "https://one-way-cab-for-you.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://one-way-cab-for-you.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ONE WAY CAB",
          url: "https://one-way-cab-for-you.lovable.app/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Do you offer one-way outstation cabs?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. We offer transparent one-way fares across Maharashtra with no return-trip charges.",
              },
            },
            {
              "@type": "Question",
              name: "Are your chauffeurs verified?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Every chauffeur is background-checked, licensed and trained for long-distance outstation travel.",
              },
            },
            {
              "@type": "Question",
              name: "How do I get a fare estimate?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Use the live fare calculator on the Rates page or start a booking on the Book page for an instant quote.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

function HeroStat({ v, l }: { v: string; l: string }) {
  return (
    <div className="glass rounded-xl px-4 py-3">
      <div className="text-lg font-extrabold text-[color:var(--gold)] sm:text-xl">{v}</div>
      <div className="text-[11px] text-muted-foreground">{l}</div>
    </div>
  );
}

function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <BrandIntro />
      <Nav />

      {/* HERO */}
      <section className="on-dark relative w-full overflow-hidden bg-[#0B1533]">
        <HeroScene />
        <HeroCar />

        <div className="relative z-20 mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 sm:pb-36 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--gold)]"
          >
            Safe • Reliable • On Time
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-2xl text-[2.25rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
          >
            Every Trip,
            <br />
            <span className="text-[color:var(--gold)]">Handled</span> with Care
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base"
          >
            One platform for your outstation, airport and corporate rides across Maharashtra.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <AuthLink to="/book" className="rounded-lg btn-gold px-6 py-3 text-sm font-bold">
              Get instant fare
            </AuthLink>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-call-care"))}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-medium hover:bg-white/10"
            >
              <PhoneCall className="h-4 w-4 text-[color:var(--gold)]" /> Talk to a human · 24×7
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[color:var(--gold)]" /> Verified drivers
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
            className="mt-10 grid max-w-xl grid-cols-3 gap-3"
          >
            <HeroStat v="500+" l="Happy customers" />
            <HeroStat v="100%" l="Safe & secure" />
            <HeroStat v="24×7" l="Available" />
          </motion.div>
        </div>
      </section>

      {/* BOOKING CARD — overlaps the hero, like a search bar */}
      <div className="relative z-30 mx-auto -mt-20 max-w-5xl px-4 sm:-mt-24 sm:px-6">
        <BookingWidget />
      </div>

      <Services />
      <Packages />
      <CareUSP />
      <Fleet />
      <WhyUs />
      <Process />

      <PopularRoutes />
      <Cities />
      <Testimonials />
      <AppCTA />
      <FAQ />
      <Footer />

      {/* Scroll cue */}
      <div className="sr-only">
        <ArrowDown className="h-4 w-4" />
      </div>
    </div>
  );
}

