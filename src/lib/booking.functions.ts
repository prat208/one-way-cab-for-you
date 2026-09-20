import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { dispatch } from "@/lib/notify.server";
import { billableDistanceKm } from "@/lib/fare";


function serverSupabase() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
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

const CITY_META: Record<
  string,
  { name: string; state: string; blurb: string; landmarks: string[] }
> = {
  pune: {
    name: "Pune",
    state: "Maharashtra",
    blurb:
      "Outstation cabs from Pune to every corner of Maharashtra and beyond — door-to-door, verified chauffeurs, transparent one-way fares.",
    landmarks: ["Pune Airport (PNQ)", "Shivajinagar", "Hinjewadi", "Kharadi", "Kothrud", "Baner"],
  },
  mumbai: {
    name: "Mumbai",
    state: "Maharashtra",
    blurb:
      "Premium outstation rides from Mumbai to Pune, Nashik, Lonavala, Shirdi and beyond. Airport pickups tracked to your flight.",
    landmarks: ["CSMT Airport (BOM)", "Andheri", "Bandra", "Powai", "Thane", "Navi Mumbai"],
  },
  kolhapur: {
    name: "Kolhapur",
    state: "Maharashtra",
    blurb:
      "Reliable one-way and round-trip cabs from Kolhapur to Pune, Mumbai, Goa and Konkan destinations. Locally owned fleet.",
    landmarks: ["Kolhapur Airport (KLH)", "Mahadwar Road", "Rajarampuri", "Shahupuri"],
  },
  nashik: {
    name: "Nashik",
    state: "Maharashtra",
    blurb:
      "Comfortable outstation travel from Nashik — Shirdi darshan trips, Mumbai airport transfers, Pune day trips, and more.",
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
    const seen = new Set<string>();
    const routes = (routesRes.data ?? [])
      .map((r) => {
        const other = r.from_city === meta.name ? r.to_city : r.from_city;
        const distance = Number(r.distance_km);
        const fare = cheapest
          ? Math.round(
              Number(cheapest.base_fare) +
                Number(cheapest.per_km_rate) * billableDistanceKm(distance),
            )
          : null;
        return {
          to: other,
          distance_km: distance,
          duration_hours: r.duration_hours ? Number(r.duration_hours) : Math.round(distance / 55),
          fare_from: fare,
        };
      })
      .filter((r) => {
        const k = r.to.toLowerCase();
        if (!r.to || k === meta.name.toLowerCase() || seen.has(k)) return false;
        seen.add(k);
        return true;
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
        fare: Math.round(Number(v.base_fare) + Number(v.per_km_rate) * pkg.km + 150 * pkg.hours),
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

    let oneWayDistance: number | null = routeRes.data?.distance_km
      ? Number(routeRes.data.distance_km)
      : null;
    let oneWayDuration: number | null = routeRes.data?.duration_hours
      ? Number(routeRes.data.duration_hours)
      : null;
    if (oneWayDistance == null) {
      const live = await openRoute(data.pickup_city, data.drop_city);
      if (!live) {
        return {
          estimates: [],
          distance_km: 0,
          duration_hours: 0,
          no_route: true as const,
          message: `Couldn't find a driving route between "${data.pickup_city}" and "${data.drop_city}". Please refine the location names.`,
        };
      }
      oneWayDistance = live.distanceKm;
      oneWayDuration = live.durationHours;
    }

    const vehicles = vehiclesRes.data ?? [];

    // ROUND TRIP: charge for return distance too, plus a small driver allowance
    const multiplier = data.trip_type === "round-trip" ? 2 : 1;
    const distance = oneWayDistance * multiplier;
    const duration = (oneWayDuration ?? oneWayDistance / 55) * multiplier;
    const driverAllowance = data.trip_type === "round-trip" ? 300 : 0;

    // Minimum billable slabs: under 200 km bills at 200 km, 200–300 km bills at 300 km
    const billableKm = billableDistanceKm(distance);

    const estimates = vehicles.map((v) => ({
      vehicle_id: v.id,
      name: v.name,
      category: v.category,
      seats: v.seats,
      per_km_rate: Number(v.per_km_rate),
      fare: Math.round(Number(v.base_fare) + Number(v.per_km_rate) * billableKm + driverAllowance),
    }));

    return {
      distance_km: distance,
      billable_km: billableKm,
      duration_hours: duration,
      estimates,
      trip_type: data.trip_type,
    };

  });

// Free routing fallback keeps arbitrary-location fare estimates independent of a map provider.
async function geocodeOne(q: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "OneWayCabs/1.0" },
  });
  if (!r.ok) return null;
  const j = (await r.json()) as Array<{ lat: string; lon: string }>;
  const first = j[0];
  if (!first) return null;
  return { lat: Number(first.lat), lon: Number(first.lon) };
}

async function openRoute(
  from: string,
  to: string,
): Promise<{
  distanceKm: number;
  durationHours: number;
} | null> {
  const [a, b] = await Promise.all([geocodeOne(from), geocodeOne(to)]);
  if (!a || !b) return null;
  const r = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`,
  );
  if (!r.ok) return null;
  const j = (await r.json()) as { routes?: Array<{ distance?: number; duration?: number }> };
  const route = j.routes?.[0];
  if (!route?.distance) return null;
  return {
    distanceKm: route.distance / 1000,
    durationHours: route.duration ? route.duration / 3600 : route.distance / 1000 / 55,
  };
}

const BookingInput = z.object({
  customer_name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9\s-]{7,20}$/, "Enter a valid phone number"),
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
  coupon_code: z.string().trim().max(40).optional().nullable(),
});

// ---------- Coupons ----------
// Public: check a coupon code against a fare and return the discounted price.
export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ code: z.string().trim().min(2).max(40), fare: z.number().nonnegative() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = serverSupabase();
    const { data: rows, error } = await supabase.rpc("validate_coupon", {
      _code: data.code,
      _fare: data.fare,
    });
    if (error) {
      console.error("[validateCoupon]", error);
      return {
        valid: false,
        code: data.code.toUpperCase(),
        discount_pct: 0,
        discount_amount: 0,
        final_fare: data.fare,
        reason: "Could not check this coupon. Try again.",
      };
    }
    const r = Array.isArray(rows) ? rows[0] : rows;
    if (!r) {
      return {
        valid: false,
        code: data.code.toUpperCase(),
        discount_pct: 0,
        discount_amount: 0,
        final_fare: data.fare,
        reason: "Coupon not found",
      };
    }
    return {
      valid: Boolean(r.valid),
      code: r.code,
      discount_pct: Number(r.discount_pct ?? 0),
      discount_amount: Number(r.discount_amount ?? 0),
      final_fare: Number(r.final_fare ?? data.fare),
      reason: r.reason ?? null,
    };
  });

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => BookingInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Derive user_id from a verified session token only. Never trust the
    // client-supplied user_id — otherwise anyone could attach bookings to
    // any account.
    let verifiedUserId: string | null = null;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const req = getRequest();
      const authHeader = req?.headers?.get("authorization") ?? "";
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        if (token && token.split(".").length === 3) {
          const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
          if (claimsData?.claims?.sub) {
            verifiedUserId = claimsData.claims.sub as string;
          }
        }
      }
    } catch (e) {
      console.error("[createBooking] token verification failed", e);
      verifiedUserId = null;
    }

    // Re-validate the coupon server-side — never trust a client-sent discount.
    const baseFare = data.estimated_fare ?? 0;
    let couponCode: string | null = null;
    let discountPct = 0;
    let discountAmount = 0;
    let finalFare = baseFare;
    if (data.coupon_code && baseFare > 0) {
      const { data: rows } = await supabaseAdmin.rpc("validate_coupon", {
        _code: data.coupon_code,
        _fare: baseFare,
      });
      const r = Array.isArray(rows) ? rows[0] : rows;
      if (r?.valid) {
        couponCode = r.code;
        discountPct = Number(r.discount_pct ?? 0);
        discountAmount = Number(r.discount_amount ?? 0);
        finalFare = Number(r.final_fare ?? baseFare);
      }
    }

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
      user_id: verifiedUserId,
      coupon_code: couponCode,
      discount_pct: couponCode ? discountPct : null,
      discount_amount: couponCode ? discountAmount : null,
      final_fare: couponCode ? finalFare : (data.estimated_fare ?? null),
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
    if (couponCode) {
      const { data: cur } = await supabaseAdmin
        .from("coupons")
        .select("id, used_count")
        .ilike("code", couponCode)
        .maybeSingle();
      if (cur) {
        await supabaseAdmin
          .from("coupons")
          .update({ used_count: Number(cur.used_count ?? 0) + 1 })
          .eq("id", cur.id);
      }
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
        couponCode,
        discountPct: couponCode ? discountPct : null,
        discountAmount: couponCode ? discountAmount : null,
        finalFare: couponCode ? finalFare : (data.estimated_fare ?? null),
      },
    }).catch((e) => console.error("[createBooking] dispatch failed", e));
    return { booking_ref: row.booking_ref };
  });

