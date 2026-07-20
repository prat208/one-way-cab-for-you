import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { dispatch } from "@/lib/notify.server";

function serverSupabase() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const CatalogInput = z.object({}).optional();

export const getCatalog = createServerFn({ method: "GET" })
  .inputValidator((d) => CatalogInput.parse(d))
  .handler(async () => {
    const supabase = serverSupabase();
    const [cities, vehicles, routes] = await Promise.all([
      supabase.from("cities").select("id,name,state").eq("is_active", true).order("name"),
      supabase.from("vehicles").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("routes").select("*").eq("is_popular", true).order("distance_km"),
    ]);
    return {
      cities: cities.data ?? [],
      vehicles: vehicles.data ?? [],
      routes: routes.data ?? [],
    };
  });

const CityInput = z.object({ slug: z.string().min(1).max(80) });

const CITY_META: Record<string, { name: string; state: string; blurb: string; landmarks: string[] }> = {
  pune: {
    name: "Pune",
    state: "Maharashtra",
    blurb: "Outstation cabs from Pune to every corner of Maharashtra and beyond — door-to-door, verified chauffeurs, transparent one-way fares.",
    landmarks: ["Pune Airport (PNQ)", "Shivajinagar", "Hinjewadi", "Kharadi", "Kothrud", "Baner"],
  },
  mumbai: {
    name: "Mumbai",
    state: "Maharashtra",
    blurb: "Premium outstation rides from Mumbai to Pune, Nashik, Lonavala, Shirdi and beyond. Airport pickups tracked to your flight.",
    landmarks: ["CSMT Airport (BOM)", "Andheri", "Bandra", "Powai", "Thane", "Navi Mumbai"],
  },
  kolhapur: {
    name: "Kolhapur",
    state: "Maharashtra",
    blurb: "Reliable one-way and round-trip cabs from Kolhapur to Pune, Mumbai, Goa and Konkan destinations. Locally owned fleet.",
    landmarks: ["Kolhapur Airport (KLH)", "Mahadwar Road", "Rajarampuri", "Shahupuri"],
  },
  nashik: {
    name: "Nashik",
    state: "Maharashtra",
    blurb: "Comfortable outstation travel from Nashik — Shirdi darshan trips, Mumbai airport transfers, Pune day trips, and more.",
    landmarks: ["Nashik Road", "College Road", "Panchavati", "Ozar Airport (ISK)"],
  },
};

export function listCitySlugs() {
  return Object.keys(CITY_META);
}

export const getCityPage = createServerFn({ method: "GET" })
  .inputValidator((d) => CityInput.parse(d))
  .handler(async ({ data }) => {
    const slug = data.slug.toLowerCase();
    const meta = CITY_META[slug];
    if (!meta) return null;
    const supabase = serverSupabase();
    const [routesRes, vehiclesRes] = await Promise.all([
      supabase
        .from("routes")
        .select("from_city,to_city,distance_km,duration_hours")
        .or(`from_city.eq.${meta.name},to_city.eq.${meta.name}`)
        .order("distance_km"),
      supabase
        .from("vehicles")
        .select("base_fare,per_km_rate")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1),
    ]);
    const cheapest = vehiclesRes.data?.[0];
    const routes = (routesRes.data ?? []).map((r) => {
      const other = r.from_city === meta.name ? r.to_city : r.from_city;
      const distance = Number(r.distance_km);
      const fare = cheapest
        ? Math.round(Number(cheapest.base_fare) + Number(cheapest.per_km_rate) * distance)
        : null;
      return {
        to: other,
        distance_km: distance,
        duration_hours: r.duration_hours ? Number(r.duration_hours) : Math.round(distance / 55),
        fare_from: fare,
      };
    });
    return { slug, ...meta, routes };
  });

const EstimateInput = z.object({
  pickup_city: z.string().min(1),
  drop_city: z.string().min(1),
  trip_type: z.enum(["one-way", "round-trip", "local"]).default("one-way"),
  return_date: z.string().optional().nullable(),
  local_package: z.enum(["4h-40km", "8h-80km", "12h-120km"]).optional().nullable(),
});

const LOCAL_PACKAGES = {
  "4h-40km": { hours: 4, km: 40 },
  "8h-80km": { hours: 8, km: 80 },
  "12h-120km": { hours: 12, km: 120 },
} as const;

export const estimateFare = createServerFn({ method: "POST" })
  .inputValidator((d) => EstimateInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = serverSupabase();

    // LOCAL: hourly package, no route lookup
    if (data.trip_type === "local") {
      const pkgKey = data.local_package ?? "8h-80km";
      const pkg = LOCAL_PACKAGES[pkgKey];
      const vehiclesRes = await supabase
        .from("vehicles")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      const vehicles = vehiclesRes.data ?? [];
      const estimates = vehicles.map((v) => ({
        vehicle_id: v.id,
        name: v.name,
        category: v.category,
        seats: v.seats,
        per_km_rate: Number(v.per_km_rate),
        fare: Math.round(
          Number(v.base_fare) + Number(v.per_km_rate) * pkg.km + 150 * pkg.hours,
        ),
      }));
      return {
        distance_km: pkg.km,
        duration_hours: pkg.hours,
        estimates,
        trip_type: "local" as const,
      };
    }

    const [routeRes, vehiclesRes] = await Promise.all([
      supabase
        .from("routes")
        .select("distance_km,duration_hours")
        .or(
          `and(from_city.eq.${data.pickup_city},to_city.eq.${data.drop_city}),and(from_city.eq.${data.drop_city},to_city.eq.${data.pickup_city})`,
        )
        .maybeSingle(),
      supabase.from("vehicles").select("*").eq("is_active", true).order("sort_order"),
    ]);

    const oneWayDistance = routeRes.data?.distance_km ?? 200;
    const oneWayDuration = routeRes.data?.duration_hours ?? Number(oneWayDistance) / 55;
    const vehicles = vehiclesRes.data ?? [];

    // ROUND TRIP: charge for return distance too, plus a small driver allowance
    const multiplier = data.trip_type === "round-trip" ? 2 : 1;
    const distance = Number(oneWayDistance) * multiplier;
    const duration = Number(oneWayDuration) * multiplier;
    const driverAllowance = data.trip_type === "round-trip" ? 300 : 0;

    const estimates = vehicles.map((v) => ({
      vehicle_id: v.id,
      name: v.name,
      category: v.category,
      seats: v.seats,
      per_km_rate: Number(v.per_km_rate),
      fare: Math.round(
        Number(v.base_fare) + Number(v.per_km_rate) * distance + driverAllowance,
      ),
    }));

    return {
      distance_km: distance,
      duration_hours: duration,
      estimates,
      trip_type: data.trip_type,
    };
  });

const BookingInput = z.object({
  customer_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[+0-9\s-]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  pickup_city: z.string().min(1).max(80),
  drop_city: z.string().min(1).max(80),
  pickup_date: z.string().min(1),
  pickup_time: z.string().max(20).optional().or(z.literal("")),
  vehicle_id: z.string().uuid().optional().nullable(),
  vehicle_name: z.string().max(60).optional(),
  distance_km: z.number().nonnegative().optional(),
  estimated_fare: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
  trip_type: z.enum(["one-way", "round-trip", "local"]).default("one-way"),
  user_id: z.string().uuid().optional().nullable(),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => BookingInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const insertRow = {
      customer_name: data.customer_name,
      phone: data.phone,
      email: data.email || null,
      pickup_city: data.pickup_city,
      drop_city: data.drop_city,
      pickup_date: data.pickup_date,
      pickup_time: data.pickup_time || null,
      vehicle_id: data.vehicle_id || null,
      vehicle_name: data.vehicle_name || null,
      distance_km: data.distance_km ?? null,
      estimated_fare: data.estimated_fare ?? null,
      notes: data.notes || null,
      trip_type: data.trip_type,
      status: "pending" as const,
      payment_status: "unpaid" as const,
      user_id: data.user_id || null,
    };
    const { data: row, error } = await supabaseAdmin
      .from("bookings")
      .insert(insertRow)
      .select("id, booking_ref, created_at")
      .single();
    if (error) {
      console.error("createBooking error", error);
      throw new Error("Could not save your booking. Please try again.");
    }
    await dispatch({
      type: "booking.created",
      payload: {
        bookingId: row.id,
        bookingRef: row.booking_ref,
        customerName: data.customer_name,
        phone: data.phone,
        email: data.email || null,
        pickupCity: data.pickup_city,
        dropCity: data.drop_city,
        pickupDate: data.pickup_date,
        pickupTime: data.pickup_time || null,
        vehicleName: data.vehicle_name || null,
        tripType: data.trip_type,
        estimatedFare: data.estimated_fare ?? null,
        distanceKm: data.distance_km ?? null,
        notes: data.notes || null,
        createdAt: row.created_at,
      },
    }).catch((e) => console.error("[createBooking] dispatch failed", e));
    return { booking_ref: row.booking_ref };
  });
