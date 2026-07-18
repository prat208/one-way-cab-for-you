import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function supabaseForUser(ctx: ToolContext) {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_my_coupons",
  title: "List my coupons",
  description:
    "Return coupons issued to the signed-in user (via their travel leads), with code, discount percent, and expiry.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("coupons")
      .select("code, discount_pct, valid_until, created_at, leads!inner(user_id)")
      .eq("leads.user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const rows = (data ?? []).map((r) => ({
      code: r.code,
      discount_pct: r.discount_pct,
      valid_until: r.valid_until,
      created_at: r.created_at,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows) }],
      structuredContent: { coupons: rows },
    };
  },
});
