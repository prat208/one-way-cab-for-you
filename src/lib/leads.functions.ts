import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  origin_city: z.string().trim().max(80).optional(),
  destination: z.string().trim().max(80).optional(),
  travel_date: z.string().optional(),
  travelers: z.number().int().min(1).max(50).optional(),
  notes: z.string().max(1000).optional(),
});

function randCouponCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "CAB-";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const submitLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => LeadSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Upsert lead by user_id (one lead per customer)
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .upsert(
        {
          user_id: context.userId,
          name: data.name,
          phone: data.phone,
          email: data.email,
          origin_city: data.origin_city ?? data.city,
          destination: data.destination ?? data.city,
          travel_date: data.travel_date ?? new Date().toISOString().slice(0, 10),
          travelers: data.travelers ?? 2,
          notes: data.notes ?? null,
          state: data.state,
          status: "new",
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (leadErr || !lead) throw new Error(leadErr?.message ?? "Failed to save lead");

    // Ensure a coupon exists for this lead (unique per lead)
    const { data: existing } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("lead_id", lead.id)
      .maybeSingle();
    let coupon = existing;
    if (!coupon) {
      for (let attempt = 0; attempt < 5 && !coupon; attempt++) {
        const code = randCouponCode();
        const { data: c, error } = await supabaseAdmin
          .from("coupons")
          .insert({ lead_id: lead.id, code, discount_pct: 10 })
          .select("*")
          .single();
        if (!error && c) coupon = c;
      }
      if (!coupon) throw new Error("Could not generate coupon");
    }

    // Fire notifications (in-app now, email/telegram once configured)
    const { dispatch } = await import("@/lib/notify.server");
    await dispatch({
      type: "lead.created",
      payload: {
        leadId: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        city: (lead as { state?: string | null; origin_city: string }).origin_city,
        state: (lead as { state?: string | null }).state ?? null,
        couponCode: coupon.code,
        loginMethod: (context.claims?.app_metadata?.provider as "email" | "phone" | "oauth") ?? "email",
        submittedAt: new Date().toISOString(),
      },
    });

    return { leadId: lead.id, coupon };
  });

export const getMyLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!lead) return { lead: null, coupon: null };
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("lead_id", lead.id)
      .maybeSingle();
    return { lead, coupon };
  });

async function requireAdmin(ctx: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const ListSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(200).default(50),
});

export const listLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ListSchema.parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabase } = context;
    let q = supabase.from("leads").select("*, coupons(code, discount_pct, valid_until)", { count: "exact" });
    if (data.status) q = q.eq("status", data.status);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.q) {
      const s = `%${data.q}%`;
      q = q.or(`name.ilike.${s},phone.ilike.${s},email.ilike.${s},origin_city.ilike.${s},state.ilike.${s}`);
    }
    const start = data.page * data.pageSize;
    q = q.order("created_at", { ascending: false }).range(start, start + data.pageSize - 1);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0 };
  });

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "negotiation", "follow_up", "converted", "lost"]).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  follow_up_at: z.string().nullable().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => UpdateSchema.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { id, ...patch } = data;
    const { supabase } = context;
    const { data: prev } = await supabase.from("leads").select("status,assigned_to").eq("id", id).single();
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    if (patch.status && prev && prev.status !== patch.status) {
      await supabase.from("lead_notes").insert({
        lead_id: id,
        author_id: context.userId,
        kind: "status_change",
        body: `Status changed from ${prev.status} to ${patch.status}`,
      });
    }
    if (patch.status === "contacted") {
      await supabase.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", id);
    }
    return { ok: true };
  });

const NoteSchema = z.object({
  leadId: z.string().uuid(),
  kind: z.enum(["note", "call", "follow_up"]).default("note"),
  body: z.string().trim().min(1).max(2000),
});

export const addLeadNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => NoteSchema.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabase } = context;
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: data.leadId,
      author_id: context.userId,
      kind: data.kind,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    if (data.kind === "call") {
      await supabase.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", data.leadId);
    }
    return { ok: true };
  });

export const listLeadNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ leadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: notes, error } = await context.supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", data.leadId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { notes: notes ?? [] };
  });

export const exportLeadsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("leads")
      .select("*, coupons(code, discount_pct, valid_until)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const headers = [
      "Created", "Name", "Phone", "Email", "City", "State",
      "Status", "AssignedTo", "FollowUpAt", "LastContactedAt", "Coupon", "Discount", "Notes",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [headers.join(",")];
    for (const r of rows ?? []) {
      const cRaw = (r as { coupons?: unknown }).coupons;
      const c = Array.isArray(cRaw) ? (cRaw[0] as { code?: string; discount_pct?: number } | undefined) : (cRaw as { code?: string; discount_pct?: number } | null);
      lines.push([
        r.created_at, r.name, r.phone, r.email, r.origin_city,
        (r as { state?: string | null }).state ?? "",
        r.status, r.assigned_to ?? "",
        (r as { follow_up_at?: string | null }).follow_up_at ?? "",
        (r as { last_contacted_at?: string | null }).last_contacted_at ?? "",
        c?.code ?? "", c?.discount_pct ?? "", r.notes ?? "",
      ].map(esc).join(","));
    }
    return { csv: lines.join("\n") };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", context.userId)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
