import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Verify an admin-signup passcode and, if valid, grant the "admin" role
// to the currently signed-in user.
export const claimAdminWithPasscode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ passcode: z.string().min(4).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const expected = process.env.ADMIN_SIGNUP_PASSCODE;
    if (!expected) throw new Error("Admin signup is not configured.");
    if (data.passcode !== expected) {
      return { ok: false as const, error: "Invalid passcode" };
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
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
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);
    const target = list.users.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );
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
