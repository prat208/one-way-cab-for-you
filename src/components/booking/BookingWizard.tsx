import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Clock, Phone, User as UserIcon, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, Check, Car, IndianRupee, Sparkles, MessageSquare, PartyPopper,
} from "lucide-react";
import { createBooking, estimateFare, getCatalog } from "@/lib/booking.functions";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

type Estimate = {
  vehicle_id: string;
  name: string;
  category: string;
  seats: number;
  per_km_rate: number;
  fare: number;
};

type TripType = "one-way" | "round-trip" | "local";
type LocalPackage = "4h-40km" | "8h-80km" | "12h-120km";

const STEPS = ["Trip", "Route", "Cab", "You", "Confirm"] as const;

const TRIPS: { id: TripType; label: string; hint: string; icon: string }[] = [
  { id: "one-way", label: "One Way", hint: "Pay only for one side", icon: "→" },
  { id: "round-trip", label: "Round Trip", hint: "Same cab, return included", icon: "⇄" },
  { id: "local", label: "Local", hint: "Hourly in-city package", icon: "◎" },
];

const PACKAGES: { id: LocalPackage; label: string; sub: string }[] = [
  { id: "4h-40km", label: "4 hrs", sub: "40 km" },
  { id: "8h-80km", label: "8 hrs", sub: "80 km" },
  { id: "12h-120km", label: "12 hrs", sub: "120 km" },
];

export function BookingWizard({
  initialPickup,
  initialDrop,
}: { initialPickup?: string; initialDrop?: string } = {}) {
  const runGetCatalog = useServerFn(getCatalog);
  const runEstimate = useServerFn(estimateFare);
  const runCreate = useServerFn(createBooking);

  const [step, setStep] = useState(0);
  const [cities, setCities] = useState<{ name: string }[]>([]);
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [localPackage, setLocalPackage] = useState<LocalPackage>("8h-80km");
  const [pickup, setPickup] = useState(initialPickup ?? "Pune");
  const [drop, setDrop] = useState(initialDrop ?? "Mumbai");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [returnDate, setReturnDate] = useState(today);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Estimate | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  useEffect(() => {
    runGetCatalog({ data: {} }).then((c) => setCities(c.cities)).catch(() => {});
  }, [runGetCatalog]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setEmail((prev) => prev || u.email || "");
        supabase.from("profiles").select("full_name,phone").eq("id", u.id).maybeSingle().then(({ data: p }) => {
          if (p?.full_name) setName((prev) => prev || p.full_name || "");
          if (p?.phone) setPhone((prev) => prev || p.phone || "");
        });
      }
    });
  }, []);

  useEffect(() => {
    if (tripType !== "local" && (!pickup || !drop || pickup === drop)) {
      setEstimates([]); setDistance(null); setDuration(null); setSelected(null); return;
    }
    setBusy(true); setError(null);
    runEstimate({
      data: {
        pickup_city: pickup,
        drop_city: tripType === "local" ? pickup : drop,
        trip_type: tripType,
        local_package: tripType === "local" ? localPackage : null,
      },
    })
      .then((r) => {
        setEstimates(r.estimates);
        setDistance(Number(r.distance_km));
        setDuration(Number(r.duration_hours));
        setSelected((prev) => r.estimates.find((e) => e.vehicle_id === prev?.vehicle_id) ?? r.estimates[0] ?? null);
      })
      .catch(() => setError("Couldn't compute fare. Try again."))
      .finally(() => setBusy(false));
  }, [pickup, drop, tripType, localPackage, runEstimate]);

  const cityList = cities.length ? cities.map((c) => c.name) : ["Pune", "Mumbai", "Kolhapur", "Nashik", "Shirdi", "Lonavala", "Mahabaleshwar"];

  function canProceed(s: number) {
    if (s === 0) return true;
    if (s === 1) return tripType === "local" ? !!pickup : pickup && drop && pickup !== drop && !!date;
    if (s === 2) return !!selected;
    if (s === 3) return name.trim().length >= 2 && /^[+0-9\s-]{7,20}$/.test(phone);
    return true;
  }

  async function confirm() {
    setError(null); setSubmitting(true);
    try {
      const notesParts: string[] = [];
      if (tripType === "round-trip") notesParts.push(`Return: ${returnDate}`);
      if (tripType === "local") notesParts.push(`Package: ${localPackage}`);
      if (notes.trim()) notesParts.push(notes.trim());
      const { data: sess } = await supabase.auth.getSession();
      const res = await runCreate({
        data: {
          customer_name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || "",
          pickup_city: pickup,
          drop_city: tripType === "local" ? pickup : drop,
          pickup_date: date,
          pickup_time: time,
          vehicle_id: selected?.vehicle_id ?? null,
          vehicle_name: selected?.name,
          distance_km: distance ?? undefined,
          estimated_fare: selected?.fare,
          trip_type: tripType,
          notes: notesParts.join(" · "),
          user_id: sess.session?.user.id ?? null,
        },
      });
      setBookingRef(res.booking_ref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingRef) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[color:var(--gold)] to-[color:var(--cyan)]">
          <PartyPopper className="h-8 w-8 text-black" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">You're booked!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Booking reference <span className="font-mono text-[color:var(--gold)]">{bookingRef}</span>
        </p>
        <div className="mt-6 space-y-1 text-sm">
          <div className="text-foreground/80">{pickup} → {tripType === "local" ? pickup : drop}</div>
          <div className="text-muted-foreground">{date} {time} · {selected?.name} · ₹{selected?.fare.toLocaleString("en-IN")}</div>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Our team will call {phone} within minutes to confirm.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={`tel:+919999999999`} className="rounded-full glass px-4 py-2 text-xs hover:bg-white/10">Call support</a>
          <Link to="/customer" className="rounded-full btn-gold px-4 py-2 text-xs font-semibold">View my trips</Link>
          <button onClick={() => { setBookingRef(null); setStep(0); }} className="rounded-full glass px-4 py-2 text-xs hover:bg-white/10">Book another</button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-3xl">
      {/* Progress */}
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex items-center gap-2">
                  <div className={`grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-semibold transition-colors ${
                    done ? "bg-[color:var(--gold)] text-black" : active ? "bg-[color:var(--gold)]/15 text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/50" : "bg-white/5 text-muted-foreground"
                  }`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`hidden text-xs sm:inline ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`mx-2 h-px flex-1 ${done ? "bg-[color:var(--gold)]/60" : "bg-white/10"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_280px]">
        {/* Step content */}
        <div className="p-5 sm:p-6 min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {step === 0 && (
                <StepPane title="What kind of trip?" hint="Pick how you want to travel">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {TRIPS.map((t) => {
                      const active = tripType === t.id;
                      return (
                        <button key={t.id} type="button" onClick={() => setTripType(t.id)}
                          className={`rounded-2xl border p-4 text-left transition-all ${active ? "border-[color:var(--gold)]/60 bg-[color:var(--gold)]/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                          <div className="text-2xl">{t.icon}</div>
                          <div className="mt-2 text-sm font-semibold">{t.label}</div>
                          <div className="text-[11px] text-muted-foreground">{t.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                  {tripType === "local" && (
                    <div className="mt-6">
                      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Choose a package</div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {PACKAGES.map((p) => {
                          const active = localPackage === p.id;
                          return (
                            <button key={p.id} type="button" onClick={() => setLocalPackage(p.id)}
                              className={`rounded-xl border p-3 text-center transition-all ${active ? "border-[color:var(--gold)]/60 bg-[color:var(--gold)]/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                              <div className="text-sm font-semibold">{p.label}</div>
                              <div className="text-[11px] text-muted-foreground">{p.sub}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </StepPane>
              )}

              {step === 1 && (
                <StepPane title="Where & when?" hint="Pickup, destination and travel date">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field icon={<MapPin className="h-4 w-4 text-[color:var(--gold)]" />} label="Pickup city">
                      <select value={pickup} onChange={(e) => setPickup(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                        {cityList.map((c) => <option key={c} value={c} className="bg-[#0a0f24]">{c}</option>)}
                      </select>
                    </Field>
                    {tripType !== "local" && (
                      <Field icon={<MapPin className="h-4 w-4 text-[color:var(--cyan)]" />} label="Destination">
                        <select value={drop} onChange={(e) => setDrop(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                          {cityList.map((c) => <option key={c} value={c} className="bg-[#0a0f24]">{c}</option>)}
                        </select>
                      </Field>
                    )}
                    <Field icon={<Calendar className="h-4 w-4 text-[color:var(--gold)]" />} label="Pickup date">
                      <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-sm outline-none [color-scheme:dark]" />
                    </Field>
                    <Field icon={<Clock className="h-4 w-4 text-[color:var(--cyan)]" />} label="Pickup time">
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent text-sm outline-none [color-scheme:dark]" />
                    </Field>
                    {tripType === "round-trip" && (
                      <Field icon={<Calendar className="h-4 w-4 text-[color:var(--gold)]" />} label="Return date">
                        <input type="date" min={date} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full bg-transparent text-sm outline-none [color-scheme:dark]" />
                      </Field>
                    )}
                  </div>
                </StepPane>
              )}

              {step === 2 && (
                <StepPane title="Choose your cab" hint={busy ? "Calculating live fares…" : `${estimates.length} options available`}>
                  {busy ? (
                    <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold)]" /></div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {estimates.map((e, i) => {
                        const active = selected?.vehicle_id === e.vehicle_id;
                        const badge = i === 0 ? "Best value" : i === estimates.length - 1 ? "Most premium" : null;
                        return (
                          <button key={e.vehicle_id} type="button" onClick={() => setSelected(e)}
                            className={`rounded-2xl border p-4 text-left transition-all ${active ? "border-[color:var(--gold)]/60 bg-[color:var(--gold)]/10 ring-1 ring-[color:var(--gold)]/40" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.category} · {e.seats} seats</div>
                                <div className="mt-0.5 text-base font-semibold">{e.name}</div>
                              </div>
                              <Car className="h-5 w-5 text-[color:var(--gold)]" />
                            </div>
                            <div className="mt-3 flex items-end justify-between">
                              <div>
                                <div className="flex items-center text-xl font-bold text-[color:var(--gold)]">
                                  <IndianRupee className="h-4 w-4" />{e.fare.toLocaleString("en-IN")}
                                </div>
                                <div className="text-[11px] text-muted-foreground">₹{e.per_km_rate}/km · all incl.</div>
                              </div>
                              {badge && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">{badge}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </StepPane>
              )}

              {step === 3 && (
                <StepPane title="Your details" hint="We'll call you to confirm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field icon={<UserIcon className="h-4 w-4 text-[color:var(--gold)]" />} label="Full name">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                    </Field>
                    <Field icon={<Phone className="h-4 w-4 text-[color:var(--cyan)]" />} label="Mobile">
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field icon={<MessageSquare className="h-4 w-4 text-[color:var(--gold)]" />} label="Email (optional)">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field icon={<Sparkles className="h-4 w-4 text-[color:var(--cyan)]" />} label="Notes (optional)">
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Child seat, extra luggage, pickup point details…" className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                      </Field>
                    </div>
                  </div>
                </StepPane>
              )}

              {step === 4 && (
                <StepPane title="Review & confirm" hint="Verify your trip details">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3 text-sm">
                    <Row label="Trip">
                      <span className="capitalize">{tripType}</span>{tripType === "local" ? ` · ${localPackage}` : ""}
                    </Row>
                    <Row label="Route">
                      <span className="font-semibold">{pickup}</span> {tripType !== "local" && <>→ <span className="font-semibold">{drop}</span></>}
                    </Row>
                    <Row label="When">{date} · {time}{tripType === "round-trip" && ` · returns ${returnDate}`}</Row>
                    <Row label="Cab">{selected?.name} · {selected?.seats} seats</Row>
                    <Row label="Passenger">{name} · {phone}</Row>
                    <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Estimated fare (pay after ride)</span>
                      <span className="flex items-center text-xl font-bold text-[color:var(--gold)]">
                        <IndianRupee className="h-4 w-4" />{selected?.fare.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </StepPane>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}

          {/* Nav buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs disabled:opacity-40">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" disabled={!canProceed(step)} onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1.5 rounded-full btn-gold px-5 py-2 text-xs font-semibold disabled:opacity-40">
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button type="button" disabled={submitting || !selected} onClick={confirm}
                className="inline-flex items-center gap-1.5 rounded-full btn-gold px-5 py-2 text-xs font-semibold disabled:opacity-40">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {submitting ? "Booking…" : "Confirm booking"}
              </button>
            )}
          </div>
        </div>

        {/* Live summary */}
        <aside className="border-t border-white/10 bg-white/[0.02] p-5 md:border-l md:border-t-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--gold)]">Trip summary</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
              <span className="font-semibold">{pickup}{tripType !== "local" && ` → ${drop}`}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {tripType === "local" ? `Local · ${localPackage}` : distance ? `${distance} km · ~${Math.round(duration ?? 0)}h` : "Enter cities"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {date} · {time}
            </div>
          </div>
          {selected && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{selected.category}</div>
              <div className="text-sm font-semibold">{selected.name}</div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-[11px] text-muted-foreground">Estimated fare</span>
                <span className="flex items-center text-lg font-bold text-[color:var(--gold)]">
                  <IndianRupee className="h-4 w-4" />{selected.fare.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}
          <ul className="mt-5 space-y-1.5 text-[11px] text-muted-foreground">
            <li className="flex gap-1.5"><Check className="h-3 w-3 text-[color:var(--gold)]" /> Pay after ride</li>
            <li className="flex gap-1.5"><Check className="h-3 w-3 text-[color:var(--gold)]" /> Free cancellation up to 12h</li>
            <li className="flex gap-1.5"><Check className="h-3 w-3 text-[color:var(--gold)]" /> Verified chauffeurs</li>
            <li className="flex gap-1.5"><Check className="h-3 w-3 text-[color:var(--gold)]" /> 24×7 support</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function StepPane({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--gold)]">Step</div>
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 focus-within:border-[color:var(--gold)]/50 hover:border-white/20">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{icon}{label}</div>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}
