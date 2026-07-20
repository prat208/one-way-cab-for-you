import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Nav } from "@/components/landing/Nav";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { AssistantPanel } from "@/components/chat/AssistantPanel";

const searchSchema = z.object({
  pickup: z.string().optional(),
  drop: z.string().optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Book a cab — ONE WAY CAB" },
      { name: "description", content: "Book outstation, round trip or local cabs across Maharashtra. Live fares, best cab picker, and an AI concierge to help you plan." },
      { property: "og:title", content: "Book a cab — ONE WAY CAB" },
      { property: "og:description", content: "Live fares, modern booking, AI concierge." },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { pickup, drop } = useSearch({ from: "/book" });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-28 sm:px-6 sm:pt-28 sm:pb-16">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--gold)]">Book your ride</div>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl md:text-4xl">Modern booking, in five steps</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Fill the wizard on the left, or ask <b>Aura</b> — our AI concierge — on the right to price your trip or pick the best cab.
            </p>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back home</Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          <BookingWizard initialPickup={pickup} initialDrop={drop} />
          <AssistantPanel />
        </div>
      </main>
    </div>
  );
}
