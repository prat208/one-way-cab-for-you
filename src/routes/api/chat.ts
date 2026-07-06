import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

function serverSupabase() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const LOCAL_PACKAGES = {
  "4h-40km": { hours: 4, km: 40 },
  "8h-80km": { hours: 8, km: 80 },
  "12h-120km": { hours: 12, km: 120 },
} as const;

const SYSTEM = `You are Aura, the AI concierge for ONE WAY CAB — a premium outstation cab service across Maharashtra (Pune, Mumbai, Kolhapur, Nashik and more).

Your job:
- Help travellers pick the best ride for their trip (family/luggage/budget).
- Give live fare estimates by calling the estimate_fare tool.
- Recommend a vehicle with reasoning via recommend_vehicle.
- Answer FAQs (payment after ride, free cancellation up to 12h, verified drivers, 24×7 support, no hidden charges, toll/parking extra).
- Check trip status via get_booking_status when the user shares a booking reference.
- List popular routes via list_popular_routes.

Be concise, warm, and specific. Use ₹ for prices. When you show a fare, always call estimate_fare first — never invent numbers. If the user wants to book, guide them to the booking wizard on the left side of the screen. Never ask for payment details.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const supabase = serverSupabase();

        const result = streamText({
          model,
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
          stopWhen: stepCountIs(50),
          tools: {
            estimate_fare: tool({
              description: "Get live fare estimates for all vehicle classes for a trip.",
              inputSchema: z.object({
                pickup_city: z.string().describe("Pickup city name, e.g. Pune"),
                drop_city: z.string().describe("Destination city (same as pickup for local)"),
                trip_type: z.enum(["one-way", "round-trip", "local"]).default("one-way"),
                local_package: z.enum(["4h-40km", "8h-80km", "12h-120km"]).nullable().default(null),
              }),
              execute: async ({ pickup_city, drop_city, trip_type, local_package }) => {
                if (trip_type === "local") {
                  const pkg = LOCAL_PACKAGES[local_package ?? "8h-80km"];
                  const v = await supabase.from("vehicles").select("*").eq("is_active", true).order("sort_order");
                  return {
                    trip_type,
                    distance_km: pkg.km,
                    duration_hours: pkg.hours,
                    estimates: (v.data ?? []).map((x) => ({
                      name: x.name,
                      category: x.category,
                      seats: x.seats,
                      fare: Math.round(Number(x.base_fare) + Number(x.per_km_rate) * pkg.km + 150 * pkg.hours),
                    })),
                  };
                }
                const [r, v] = await Promise.all([
                  supabase.from("routes").select("distance_km,duration_hours")
                    .or(`and(from_city.eq.${pickup_city},to_city.eq.${drop_city}),and(from_city.eq.${drop_city},to_city.eq.${pickup_city})`)
                    .maybeSingle(),
                  supabase.from("vehicles").select("*").eq("is_active", true).order("sort_order"),
                ]);
                const oneWay = Number(r.data?.distance_km ?? 200);
                const mult = trip_type === "round-trip" ? 2 : 1;
                const distance = oneWay * mult;
                const allowance = trip_type === "round-trip" ? 300 : 0;
                return {
                  trip_type,
                  distance_km: distance,
                  duration_hours: Number(r.data?.duration_hours ?? distance / 55),
                  estimates: (v.data ?? []).map((x) => ({
                    name: x.name,
                    category: x.category,
                    seats: x.seats,
                    fare: Math.round(Number(x.base_fare) + Number(x.per_km_rate) * distance + allowance),
                  })),
                };
              },
            }),

            recommend_vehicle: tool({
              description: "Recommend the best vehicle class for the traveller.",
              inputSchema: z.object({
                passengers: z.number().int().min(1).max(20),
                luggage: z.enum(["light", "medium", "heavy"]).default("medium"),
                budget: z.enum(["economy", "balanced", "premium"]).default("balanced"),
              }),
              execute: async ({ passengers, luggage, budget }) => {
                const v = await supabase.from("vehicles").select("*").eq("is_active", true).order("sort_order");
                const list = v.data ?? [];
                const enough = list.filter((x) => x.seats >= passengers + (luggage === "heavy" ? 1 : 0));
                const pool = enough.length ? enough : list;
                const pick =
                  budget === "economy"
                    ? [...pool].sort((a, b) => Number(a.per_km_rate) - Number(b.per_km_rate))[0]
                    : budget === "premium"
                      ? [...pool].sort((a, b) => Number(b.per_km_rate) - Number(a.per_km_rate))[0]
                      : pool[Math.floor(pool.length / 2)];
                return {
                  recommended: pick && {
                    name: pick.name,
                    category: pick.category,
                    seats: pick.seats,
                    per_km_rate: Number(pick.per_km_rate),
                  },
                  reason: `Fits ${passengers} passenger${passengers > 1 ? "s" : ""} with ${luggage} luggage on a ${budget} budget.`,
                };
              },
            }),

            get_booking_status: tool({
              description: "Look up a booking by its reference code (e.g. OWC-XXXXXX).",
              inputSchema: z.object({ booking_ref: z.string().min(3).max(40) }),
              execute: async ({ booking_ref }) => {
                const { data } = await supabase.rpc("lookup_booking", { _ref: booking_ref });
                const row = Array.isArray(data) ? data[0] : null;
                if (!row) return { found: false, booking_ref };
                return { found: true, ...row };
              },
            }),

            list_popular_routes: tool({
              description: "List popular outstation routes, optionally filtered by origin city.",
              inputSchema: z.object({ from_city: z.string().nullable().default(null) }),
              execute: async ({ from_city }) => {
                let q = supabase.from("routes").select("from_city,to_city,distance_km,duration_hours").eq("is_popular", true);
                if (from_city) q = q.or(`from_city.eq.${from_city},to_city.eq.${from_city}`);
                const { data } = await q.order("distance_km").limit(12);
                return { routes: data ?? [] };
              },
            }),
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
