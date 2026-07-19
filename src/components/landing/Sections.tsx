import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Car,
  Route as RouteIcon,
  Plane,
  Building2,
  ShieldCheck,
  Clock,
  Wallet,
  Headphones,
  Sparkles,
  MapPin,
  UserRound,
  Star,
  ArrowRight,
  Phone,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import { CARE_NUMBERS } from "@/components/CallCare";
import suvImg from "@/assets/hero-suv.png";
import sedanAsset from "@/assets/sedan.png.asset.json";
import suvAsset from "@/assets/suv.png.asset.json";
import innovaAsset from "@/assets/innova.png.asset.json";
import tempoAsset from "@/assets/tempo.png.asset.json";
import { AuthLink } from "@/components/AuthLink";
import { BrandLogo } from "@/components/BrandLogo";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

export function Services() {
  const items = [
    { icon: RouteIcon, title: "Outstation One-Way", body: "Pay only for one side. Perfect for weekend trips across Maharashtra." },
    { icon: Car, title: "Round Trip", body: "Return the same day or after a few days. Same driver, same car." },
    { icon: Plane, title: "Airport Transfer", body: "Flight-tracked pickup and drop to Pune & Mumbai airports." },
    { icon: Building2, title: "Corporate Travel", body: "Monthly billing, professional chauffeurs, dedicated account manager." },
  ];
  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Services" title={<>Every trip, <span className="text-gradient-gold">handled</span>.</>} sub="One platform for your outstation, airport and corporate rides." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="glass group relative overflow-hidden rounded-2xl p-6"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[color:var(--gold)]/10 blur-2xl transition-opacity group-hover:opacity-100" />
              <it.icon className="h-8 w-8 text-[color:var(--gold)]" />
              <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Fleet() {
  const fleet = [
    { name: "Sedan", tag: "Comfort", seats: 4, rate: "₹12/km", pts: ["AC · Music", "2 large bags", "Great for couples"] },
    { name: "SUV", tag: "Premium", seats: 6, rate: "₹16/km", pts: ["Extra headroom", "4 large bags", "Ideal weekend trips"] },
    { name: "Innova Crysta", tag: "Luxury", seats: 7, rate: "₹19/km", pts: ["Plush interiors", "4 large bags", "Silent cabin"] },
    { name: "Tempo Traveller", tag: "Group", seats: 12, rate: "₹26/km", pts: ["Reclining seats", "8 large bags", "Group outings"] },
  ];
  return (
    <section id="fleet" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(255,200,61,0.08),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Fleet" title={<>Cars you'd want to <span className="text-gradient-gold">be seen in</span>.</>} sub="Late-model, deep-cleaned, and driven by verified chauffeurs." />
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {fleet.map((f, i) => (
            <motion.article
              key={f.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="glass group relative overflow-hidden rounded-3xl p-5"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1030] to-[#050816]">
                <img
                  src={suvImg}
                  alt={f.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-2 right-2 rounded-full glass px-2 py-1 text-[10px] uppercase tracking-wider">
                  {f.tag}
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{f.name}</h3>
                  <div className="text-xs text-muted-foreground">{f.seats} seats · AC</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gradient-gold">{f.rate}</div>
                  <div className="text-[10px] text-muted-foreground">starting</div>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {f.pts.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[color:var(--gold)]" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyUs() {
  const feats = [
    { icon: ShieldCheck, title: "Verified chauffeurs", body: "Background-checked, uniformed, professionally trained drivers." },
    { icon: Wallet, title: "Transparent pricing", body: "No hidden charges. What you see on the estimate is what you pay." },
    { icon: Clock, title: "On-time, always", body: "97.3% of our rides start within 5 minutes of scheduled pickup." },
    { icon: Headphones, title: "24×7 live support", body: "Real humans on chat and call — before, during, and after your ride." },
    { icon: Sparkles, title: "Sanitised cabins", body: "Every car deep-cleaned between trips. Bottled water on board." },
    { icon: MapPin, title: "Door-to-door", body: "Pickup from your gate, drop at your destination — nothing in between." },
  ];
  return (
    <section id="why" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Why ONE WAY CAB" title={<>Built for people who <span className="text-gradient-gold">value their time</span>.</>} sub="Six reasons customers refer us to their friends and family." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <f.icon className="h-6 w-6 text-[color:var(--cyan)]" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Process() {
  const steps = [
    { n: "01", title: "Enter your trip", body: "Pickup & destination cities, date, phone." },
    { n: "02", title: "See instant fare", body: "Live estimate across sedan, SUV, Innova, tempo." },
    { n: "03", title: "Confirm on call", body: "Our team calls in minutes to verify details." },
    { n: "04", title: "Ride and relax", body: "Verified chauffeur, door-to-door, pay after ride." },
  ];
  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="How it works" title={<>Booked in under a <span className="text-gradient-gold">minute</span>.</>} sub="No app to download. No signup. No back-and-forth." />
        <div className="relative mt-16 grid gap-6 md:grid-cols-4">
          <div className="pointer-events-none absolute inset-x-6 top-8 hidden h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/40 to-transparent md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="glass relative rounded-2xl p-6"
            >
              <div className="text-4xl font-bold text-gradient-gold">{s.n}</div>
              <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PopularRoutes() {
  const routes = [
    { from: "Pune", to: "Kolhapur", km: 230, price: 3260 },
    { from: "Pune", to: "Nashik", km: 210, price: 3020 },
    { from: "Pune", to: "Mumbai", km: 150, price: 2300 },
    { from: "Mumbai", to: "Nashik", km: 170, price: 2540 },
    { from: "Pune", to: "Shirdi", km: 185, price: 2720 },
    { from: "Pune", to: "Mahabaleshwar", km: 120, price: 1940 },
    { from: "Mumbai", to: "Lonavala", km: 80, price: 1460 },
    { from: "Mumbai", to: "Pune", km: 150, price: 2300 },
  ];
  return (
    <section id="routes" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Popular routes" title={<>Most-loved <span className="text-gradient-gold">outstation trips</span>.</>} sub="Fares below are indicative sedan one-way rates." />
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {routes.map((r, i) => (
            <motion.div
              key={`${r.from}-${r.to}`}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 4) * 0.06 }}
            >
              <AuthLink
                to="/book"
                className="glass group flex items-center justify-between rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className="text-sm text-muted-foreground">{r.from}</div>
                  <div className="flex items-center gap-1.5 text-base font-semibold">
                    <span>→</span> {r.to}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{r.km} km · ~{Math.round(r.km / 55)}h</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">from</div>
                  <div className="text-base font-bold text-gradient-gold">₹{r.price.toLocaleString("en-IN")}</div>
                </div>
              </AuthLink>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cities() {
  const cities = [
    { slug: "pune", name: "Pune", tag: "Home base · IT hub" },
    { slug: "mumbai", name: "Mumbai", tag: "Airport transfers · Coast" },
    { slug: "kolhapur", name: "Kolhapur", tag: "Konkan gateway" },
    { slug: "nashik", name: "Nashik", tag: "Shirdi · Wine country" },
  ];
  return (
    <section id="cities" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Cities we serve"
          title={<>Book from your <span className="text-gradient-gold">home city</span>.</>}
          sub="Dedicated pages, fares and popular routes for each city we operate from."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((c, i) => (
            <motion.div key={c.slug} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
              <Link
                to="/city/$slug"
                params={{ slug: c.slug }}
                className="glass group relative flex h-full items-center justify-between overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{c.tag}</div>
                  <div className="mt-1 text-xl font-semibold">{c.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[color:var(--gold)]">
                    Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
                <MapPin className="h-8 w-8 text-[color:var(--gold)]/60" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const t = [
    { n: "Aarti S.", city: "Pune → Kolhapur", body: "Chauffeur was on time and super polite. Car smelled brand new. Best outstation experience I've had in years.", rating: 5 },
    { n: "Rohit M.", city: "Mumbai → Nashik", body: "Booked at 10 pm for a 6 am pickup. They confirmed on WhatsApp in minutes. Fare was exactly what the estimate showed.", rating: 5 },
    { n: "Neha K.", city: "Pune → Mahabaleshwar", body: "Loved the Innova. Kids slept the whole way. Driver stopped at a great tea break spot without me asking.", rating: 5 },
  ];
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Loved by travellers" title={<>What our <span className="text-gradient-gold">riders say</span>.</>} sub="A snapshot of thousands of 5-star reviews." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {t.map((r, i) => (
            <motion.figure
              key={r.n}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: r.rating }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-[color:var(--gold)] text-[color:var(--gold)]" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm text-foreground/90">"{r.body}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/5">
                  <UserRound className="h-4 w-4 text-[color:var(--cyan)]" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{r.n}</div>
                  <div className="text-[11px] text-muted-foreground">{r.city}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const items = [
    { q: "How do I pay?", a: "Cash or UPI to the driver after the ride. Corporate customers can request monthly invoicing." },
    { q: "What's the cancellation policy?", a: "Free cancellation up to 12 hours before pickup. After that, a small driver-allowance fee applies." },
    { q: "Do you charge for return with one-way?", a: "No — one-way rides mean you only pay for the distance you travel." },
    { q: "Is toll & parking included?", a: "Toll, state permits and parking are billed at actuals with digital receipts." },
    { q: "Which cars do you offer?", a: "Sedan, SUV, Innova Crysta and Tempo Traveller — all late-model, sanitised and AC." },
  ];
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeader eyebrow="FAQ" title={<>Answers, before you <span className="text-gradient-gold">ask</span>.</>} sub="Everything you need to know before you book." />
        <div className="mt-12 divide-y divide-white/10 rounded-2xl glass">
          {items.map((it) => (
            <details key={it.q} className="group px-5 py-4 open:bg-white/[0.03]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                <span className="text-sm font-medium">{it.q}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-[color:var(--gold)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#03060f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <BrandLogo crop className="h-12 w-12" />
              <div>
                <div className="text-sm font-bold tracking-wide">ONEWAYCABS</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tours &amp; Travels · Kolhapur</div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Premium outstation travel across Maharashtra. Transparent fares. Verified chauffeurs.
              Booked in under a minute.
            </p>
            <address className="mt-5 not-italic text-sm text-foreground/80">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Visit us</div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Tawade+hotel+near+Sai+medical+Bapat+Camp+Gandhinagar+Kolhapur+416005"
                target="_blank"
                rel="noreferrer"
                className="mt-2 block hover:text-[color:var(--gold)]"
              >
                Tawade Hotel, near Sai Medical,<br />
                Bapat Camp, Gandhinagar,<br />
                Kolhapur, Maharashtra 416005
              </a>
            </address>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Company</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#services" className="text-foreground/80 hover:text-foreground">Services</a></li>
              <li><a href="#fleet" className="text-foreground/80 hover:text-foreground">Fleet</a></li>
              <li><a href="#routes" className="text-foreground/80 hover:text-foreground">Popular routes</a></li>
              <li><a href="#faq" className="text-foreground/80 hover:text-foreground">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contact</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="tel:+918999740424" className="text-foreground/80 hover:text-foreground">24×7 helpline · +91 8999740424</a></li>
              <li><a href="tel:+919403001415" className="text-foreground/80 hover:text-foreground">Sales · +91 9403001415</a></li>
              <li><a href="mailto:onewaycabsc@gmail.com" className="text-foreground/80 hover:text-foreground">onewaycabsc@gmail.com</a></li>
              <li className="text-foreground/80">Pune · Mumbai · Kolhapur · Nashik</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>
            <Link
              to="/admin-signup"
              aria-label="Owner access"
              title="Owner access"
              className="text-muted-foreground/60 hover:text-[color:var(--gold)]"
            >
              ©
            </Link>{" "}
            {new Date().getFullYear()} ONE WAY CAB. All rights reserved.
          </div>
          <div>Made with obsessive attention to detail.</div>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <motion.div {...fadeUp} className="text-xs uppercase tracking-[0.22em] text-[color:var(--gold)]">
        {eyebrow}
      </motion.div>
      <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="mt-3 text-3xl font-semibold sm:text-4xl md:text-5xl">
        {title}
      </motion.h2>
      <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-4 text-sm text-muted-foreground sm:text-base">
        {sub}
      </motion.p>
    </div>
  );
}

export function CareUSP() {
  const openCare = () =>
    typeof window !== "undefined" && window.dispatchEvent(new CustomEvent("open-call-care"));
  const perks = [
    { icon: PhoneCall, title: "Real human, first ring", body: "No IVR mazes. A trip planner picks up in under 20 seconds — day or night." },
    { icon: MessageCircle, title: "Personalized on call", body: "We already see your city, destination, date & coupon — no re-explaining your trip." },
    { icon: ShieldCheck, title: "One number, end-to-end", body: "Booking, driver ETA, changes, refunds — the same person owns your ride." },
  ];
  return (
    <section id="care" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(255,200,61,0.10),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass relative overflow-hidden rounded-3xl border border-[color:var(--gold)]/20 p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--gold)]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[color:var(--cyan)]/10 blur-3xl" />

          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <motion.div {...fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--gold)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--gold)]/70 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--gold)]" />
                </span>
                Our USP · Talk to a human, 24×7
              </motion.div>

              <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="mt-4 text-3xl font-semibold sm:text-4xl md:text-5xl">
                Every ride begins with a <span className="text-gradient-gold">real conversation</span>.
              </motion.h2>
              <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
                Bots quote fares. Humans plan trips. Call us and a trip planner answers with your name, route, date and coupon already on screen — so you get the right car, the right price, in one call.
              </motion.p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={openCare}
                  className="inline-flex items-center gap-2 rounded-full btn-gold px-5 py-3 text-sm font-semibold"
                >
                  <PhoneCall className="h-4 w-4" /> Speak to a planner
                </button>
                {CARE_NUMBERS.map((c) => (
                  <a
                    key={c.number}
                    href={`tel:+91${c.number}`}
                    className="inline-flex items-center gap-2 rounded-full glass px-4 py-2.5 text-sm hover:bg-white/10"
                  >
                    <Phone className="h-4 w-4 text-[color:var(--gold)]" /> +91 {c.number}
                    <span className="hidden text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:inline">
                      · {c.label}
                    </span>
                  </a>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>Avg pickup: 20s</span>
                <span>· Same agent till drop</span>
                <span>· WhatsApp fallback</span>
              </div>
            </div>

            <div className="grid gap-3">
              {perks.map((p, i) => (
                <motion.div
                  key={p.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: 0.08 * i }}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{p.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{p.body}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

