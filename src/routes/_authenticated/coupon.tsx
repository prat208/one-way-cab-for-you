import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyLead } from "@/lib/leads.functions";
import { CouponCard } from "@/components/coupon/CouponCard";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coupon")({
  head: () => ({ meta: [{ title: "Your coupon — ONE WAY CAB" }] }),
  component: CouponPage,
});

type Data = { lead: { name: string } | null; coupon: { code: string; discount_pct: number; valid_until: string } | null };

function CouponPage() {
  const nav = useNavigate();
  const fetchLead = useServerFn(getMyLead);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetchLead().then((r) => {
      if (!r.lead || !r.coupon) nav({ to: "/lead" });
      else setData(r as Data);
    });
  }, [fetchLead, nav]);

  if (!data?.coupon || !data.lead) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-xs uppercase tracking-wider text-[color:var(--gold)]">You're set</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          Here's your coupon, {data.lead.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save it or share it — our sales team will apply it when you book.
        </p>

        <div className="mt-8">
          <CouponCard
            code={data.coupon.code}
            customerName={data.lead.name}
            discountPct={data.coupon.discount_pct}
            validUntil={data.coupon.valid_until}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--gold)] px-4 py-2.5 text-sm font-semibold text-[#2b2620] hover:opacity-90"
          >
            Book a cab now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-white/[0.03]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
