import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { createBooking, estimateFare, getCatalog } from "@/lib/booking.functions";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

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

const TRIPS: { id: TripType; label: string; hint: string }[] = [
  { id: "one-way", label: "One Way", hint: "Pay only for one side" },
  { id: "round-trip", label: "Round Trip", hint: "Same cab, return included" },
  { id: "local", label: "Local", hint: "Hourly package in-city" },
];

const PACKAGES: { id: LocalPackage; label: string }[] = [
  { id: "4h-40km", label: "4 hrs · 40 km" },
  { id: "8h-80km", label: "8 hrs · 80 km" },
  { id: "12h-120km", label: "12 hrs · 120 km" },
];

export function BookingWidget({
  initialPickup,
  initialDrop,
}: {
  initialPickup?: string;
  initialDrop?: string;
} = {}) {
  const runGetCatalog = useServerFn(getCatalog);
  const runEstimate = useServerFn(estimateFare);
  const runCreate = useServerFn(createBooking);

  const [cities, setCities] = useState<{ name: string }[]>([]);
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [localPackage, setLocalPackage] = useState<LocalPackage>("8h-80km");
  const [pickup, setPickup] = useState(initialPickup ?? "Pune");
  const [drop, setDrop] = useState(initialDrop ?? "Kolhapur");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [returnDate, setReturnDate] = useState(today);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Estimate | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    runGetCatalog({ data: {} })
      .then((c) => setCities(c.cities))
      .catch(() => {});
  }, [runGetCatalog]);

  useEffect(() => {
    if (tripType !== "local" && (!pickup || !drop || pickup === drop)) {
      setEstimates([]);
      setDistance(null);
      setSelected(null);
      return;
    }
    setBusy(true);
    setError(null);
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
        setDistance(r.distance_km);
        setSelected(r.estimates[0] ?? null);
      })
      .catch(() => setError("Couldn't compute fare. Try again."))
      .finally(() => setBusy(false));
  }, [pickup, drop, tripType, localPackage, runEstimate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[+0-9\s-]{7,20}$/.test(phone)) return setError("Please enter a valid phone number.");
    if (tripType !== "local" && pickup === drop) return setError("Pickup and destination must differ.");
    setSubmitting(true);
    try {
      const notesParts: string[] = [];
      if (tripType === "round-trip") notesParts.push(`Return date: ${returnDate}`);
      if (tripType === "local") notesParts.push(`Package: ${localPackage}`);
      const { data: sess } = await supabase.auth.getSession();
      const res = await runCreate({
        data: {
          customer_name: name.trim(),
          phone: phone.trim(),
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
      setRef(res.booking_ref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const cityList = cities.length
    ? cities.map((c) => c.name)
    : ["Pune", "Mumbai", "Kolhapur", "Nashik", "Shirdi", "Lonavala", "Mahabaleshwar"];

  return (
    <motion.div
      id="book"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="glass glow-ring w-full max-w-xl rounded-3xl p-5 sm:p-6"
    >
      <AnimatePresence mode="wait">
        {ref ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-6 text-center"
          >
            <CheckCircle2 className="mx-auto h-14 w-14 text-[color:var(--gold)]" />
            <h3 className="mt-4 text-2xl font-semibold">Booking received</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your reference is <span className="font-mono text-[color:var(--gold)]">{ref}</span>.
              Our team will call you on <b>{phone}</b> within minutes to confirm.
            </p>
            <button
              onClick={() => {
                setRef(null);
                setName("");
                setPhone("");
              }}
              className="mt-6 rounded-full glass px-5 py-2 text-sm font-medium hover:bg-white/10"
            >
              Book another trip
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--gold)]">
                  Instant booking
                </div>
                <h3 className="mt-1 text-lg font-semibold">Where are you heading?</h3>
              </div>
              <Sparkles className="h-5 w-5 text-[color:var(--cyan)]" />
            </div>

            {/* Trip type tabs */}
            <div
              role="tablist"
              aria-label="Trip type"
              className="grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"
            >
              {TRIPS.map((t) => {
                const active = tripType === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setTripType(t.id)}
                    className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[color:var(--gold)]/15 text-[color:var(--gold)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {TRIPS.find((t) => t.id === tripType)?.hint}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field icon={<MapPin className="h-4 w-4 text-[color:var(--gold)]" />} label="Pickup city">
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                >
                  {cityList.map((c) => (
                    <option key={c} value={c} className="bg-[#0a0f24]">
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              {tripType === "local" ? (
                <Field icon={<Clock className="h-4 w-4 text-[color:var(--cyan)]" />} label="Package">
                  <select
                    value={localPackage}
                    onChange={(e) => setLocalPackage(e.target.value as LocalPackage)}
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                  >
                    {PACKAGES.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0a0f24]">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field icon={<MapPin className="h-4 w-4 text-[color:var(--cyan)]" />} label="Destination">
                  <select
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                  >
                    {cityList.map((c) => (
                      <option key={c} value={c} className="bg-[#0a0f24]">
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field icon={<Calendar className="h-4 w-4 text-[color:var(--gold)]" />} label="Pickup date">
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
                />
              </Field>
              <Field icon={<Clock className="h-4 w-4 text-[color:var(--cyan)]" />} label="Pickup time">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
                />
              </Field>

              {tripType === "round-trip" && (
                <Field
                  icon={<Calendar className="h-4 w-4 text-[color:var(--gold)]" />}
                  label="Return date"
                >
                  <input
                    type="date"
                    value={returnDate}
                    min={date}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
                  />
                </Field>
              )}

              <Field icon={<Phone className="h-4 w-4 text-[color:var(--cyan)]" />} label="Mobile number">
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
              </Field>
            </div>

            <Field icon={<User className="h-4 w-4 text-[color:var(--gold)]" />} label="Your name">
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
            </Field>

            {/* Estimates */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Fare estimate</span>
                <span>
                  {busy
                    ? "Calculating…"
                    : tripType === "local"
                      ? distance
                        ? `${distance} km included`
                        : "Choose a package"
                      : distance
                        ? `${distance} km · ${tripType === "round-trip" ? "round trip" : "one way"}`
                        : "Pick two cities"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {estimates.map((e) => {
                  const isActive = selected?.vehicle_id === e.vehicle_id;
                  return (
                    <button
                      type="button"
                      key={e.vehicle_id}
                      onClick={() => setSelected(e)}
                      className={`rounded-xl border p-2 text-left transition-all ${
                        isActive
                          ? "border-[color:var(--gold)]/60 bg-[color:var(--gold)]/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {e.category}
                      </div>
                      <div className="text-sm font-semibold text-foreground">{e.name}</div>
                      <div className="mt-1 text-base font-bold text-gradient-gold">
                        ₹{e.fare.toLocaleString("en-IN")}
                      </div>
                    </button>
                  );
                })}
                {!estimates.length && !busy && (
                  <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                    {tripType === "local"
                      ? "Choose a city and package to see fares."
                      : "Choose different pickup & destination cities to see live fares."}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !selected}
              className="group flex w-full items-center justify-center gap-2 rounded-full btn-gold px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Book now — pay after ride
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              No signup needed · Instant confirmation call · Free cancellation up to 12h
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors focus-within:border-[color:var(--gold)]/50 hover:border-white/20">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </label>
  );
}
