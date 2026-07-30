import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Verify an admin-signup passcode and, if valid, grant the "admin" role
// to the currently signed-in user.
export const claimAdminWithPasscode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ passcode: z.string().min(4).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const expected = process.env.ADMIN_SIGNUP_PASSCODE;
    if (!expected) throw new Error("Admin signup is not configured.");
    if (data.passcode !== expected) {
      return { ok: false as const, error: "Invalid passcode" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// Admin-only: change a booking's driver assignment.
export const assignBookingDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        booking_id: z.string().uuid(),
        driver_id: z.string().uuid().nullable(),
        driver_vehicle_id: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("bookings")
      .update({
        driver_id: data.driver_id,
        driver_vehicle_id: data.driver_vehicle_id ?? null,
        status: data.driver_id ? "confirmed" : "pending",
      })
      .eq("id", data.booking_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin-only: approve/reject a driver's vehicle.
export const setDriverVehicleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "inactive"]),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("driver_vehicles")
      .update({ status: data.status, notes: data.notes ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin-only: grant/revoke a role on a user by email.
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(["admin", "driver", "customer"]),
        action: z.enum(["grant", "revoke"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);
    const target = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!target) return { ok: false as const, error: "User not found" };
    if (data.action === "grant") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: target.id, role: data.role }, { onConflict: "user_id,role" });
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", target.id)
        .eq("role", data.role);
      if (error) return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

// ---------- Coupons (admin) ----------
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listCoupons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("coupons")
      .select("id,code,label,discount_pct,valid_until,max_uses,used_count,active,min_fare,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return { coupons: data ?? [] };
  });

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        code: z
          .string()
          .trim()
          .min(3)
          .max(24)
          .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only")
          .optional()
          .or(z.literal("")),
        label: z.string().trim().max(80).optional().or(z.literal("")),
        discount_pct: z.number().int().min(1).max(90),
        valid_days: z.number().int().min(1).max(365).default(60),
        max_uses: z.number().int().min(0).max(100000).default(0),
        min_fare: z.number().min(0).max(1000000).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const code = (data.code || `OWC-${Math.random().toString(36).slice(2, 8)}`).toUpperCase();
    const validUntil = new Date(Date.now() + data.valid_days * 86400000)
      .toISOString()
      .slice(0, 10);
    const { data: row, error } = await context.supabase
      .from("coupons")
      .insert({
        code,
        label: data.label || null,
        discount_pct: data.discount_pct,
        valid_until: validUntil,
        max_uses: data.max_uses,
        min_fare: data.min_fare,
        active: true,
        created_by: context.userId,
        lead_id: null,
      })
      .select("id,code,label,discount_pct,valid_until,max_uses,used_count,active,min_fare,created_at")
      .single();
    if (error) {
      return {
        ok: false as const,
        error: error.code === "23505" ? "That coupon code already exists." : error.message,
      };
    }
    return { ok: true as const, coupon: row };
  });

export const setCouponActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("coupons")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
