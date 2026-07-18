import { useEffect, useState } from "react";
import { Phone, X, Copy, Check, MessageCircle, User2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const CARE_NUMBERS = [
  { label: "Bookings & Support", number: "8999740424" },
  { label: "Sales & Trip Planning", number: "9403001415" },
];

type Personalization = {
  name?: string;
  city?: string;
  destination?: string;
  travel_date?: string;
  coupon?: string;
  lastBookingRef?: string;
};

export function CallCare() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [info, setInfo] = useState<Personalization>({});

  useEffect(() => {
    if (!user || !open) return;
    let cancelled = false;
    (async () => {
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split("@")[0];
      const next: Personalization = { name };
      const [{ data: lead }, { data: booking }] = await Promise.all([
        supabase
          .from("leads")
          .select("id, origin_city, destination, travel_date")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select("booking_ref")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      let couponCode: string | undefined;
      if (lead?.id) {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("code")
          .eq("lead_id", lead.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        couponCode = coupon?.code;
      }
      if (cancelled) return;
      if (lead) {
        next.city = lead.origin_city ?? undefined;
        next.destination = lead.destination ?? undefined;
        next.travel_date = lead.travel_date ?? undefined;
      }
      if (couponCode) next.coupon = couponCode;
      if (booking?.booking_ref) next.lastBookingRef = booking.booking_ref;
      setInfo(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, open]);


  function personalizedMessage() {
    const lines: string[] = [];
    lines.push("Hi ONE WAY CAB team,");
    if (info.name) lines.push(`I'm ${info.name}.`);
    if (info.destination) {
      lines.push(
        `I'm planning a trip${info.city ? ` from ${info.city}` : ""} to ${info.destination}${
          info.travel_date ? ` on ${info.travel_date}` : ""
        }.`,
      );
    } else if (info.city) {
      lines.push(`I'm based in ${info.city} and would like to plan a trip.`);
    } else {
      lines.push("I'd like help planning a trip.");
    }
    if (info.coupon) lines.push(`My coupon: ${info.coupon}.`);
    if (info.lastBookingRef) lines.push(`Booking ref: ${info.lastBookingRef}.`);
    lines.push("Please call me back at your earliest.");
    return lines.join("\n");
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const msg = personalizedMessage();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Call customer care"
        className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 rounded-full btn-gold px-4 py-3 shadow-lg shadow-black/30 hover:scale-[1.03] transition-transform"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
        </span>
        <Phone className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-semibold">24×7 Care</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl glass border border-white/10 p-5 sm:p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--gold)]">
                  Talk to a real human
                </div>
                <h3 className="mt-1 text-xl font-semibold text-foreground">
                  ONE WAY CAB · Customer Care
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Available 24×7. We'll answer with your trip details ready.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {user && (info.name || info.destination || info.coupon) && (
              <div className="mt-4 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/[0.06] p-3">
                <div className="flex items-center gap-2 text-xs text-[color:var(--gold)]">
                  <User2 className="h-3.5 w-3.5" /> Your details will be shared on call
                </div>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                  {info.name && <div><span className="text-foreground">{info.name}</span></div>}
                  {(info.city || info.destination) && (
                    <div>
                      Trip: {info.city ?? "—"} → <span className="text-foreground">{info.destination ?? "TBD"}</span>
                      {info.travel_date ? ` · ${info.travel_date}` : ""}
                    </div>
                  )}
                  {info.coupon && <div>Coupon: <span className="text-foreground">{info.coupon}</span></div>}
                  {info.lastBookingRef && <div>Booking: <span className="text-foreground">{info.lastBookingRef}</span></div>}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-2">
              {CARE_NUMBERS.map((c) => (
                <div
                  key={c.number}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {c.label}
                    </div>
                    <div className="text-lg font-semibold tracking-wide text-foreground">
                      +91 {c.number}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copy(c.number, `copy-${c.number}`)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      aria-label="Copy number"
                    >
                      {copied === `copy-${c.number}` ? (
                        <Check className="h-4 w-4 text-[color:var(--gold)]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <a
                      href={`https://wa.me/91${c.number}?text=${encodeURIComponent(msg)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                    <a
                      href={`tel:+91${c.number}`}
                      className="inline-flex items-center gap-1.5 rounded-lg btn-gold px-3 py-2 text-xs font-semibold"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <details className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Preview the message we'll send on WhatsApp
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-foreground/90">{msg}</pre>
              <button
                onClick={() => copy(msg, "msg")}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-muted-foreground hover:text-foreground"
              >
                {copied === "msg" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy message
              </button>
            </details>

            {!user && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Tip: sign in first — we'll pre-fill your trip details and coupon on the call.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
