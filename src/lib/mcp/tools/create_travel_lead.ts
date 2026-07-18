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
  name: "create_travel_lead",
  title: "Create travel lead",
  description:
    "Submit a new travel enquiry for the signed-in user. The sales team is notified and the app issues a coupon.",
  inputSchema: {
    name: z.string().describe("Customer full name."),
    phone: z.string().describe("Customer phone number, digits and + only."),
    email: z.string().describe("Customer email address."),
    origin_city: z.string().describe("City the traveller is departing from."),
    destination: z.string().describe("Destination city or region."),
    travel_date: z.string().describe("Planned travel date (YYYY-MM-DD)."),
    travelers: z.number().int().default(2).describe("Number of travellers."),
    state: z.string().nullable().default(null).describe("Optional state / region."),
    budget_range: z.string().nullable().default(null).describe("Optional budget range."),
    notes: z.string().nullable().default(null).describe("Optional free-text notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("leads")
      .insert({
        user_id: ctx.getUserId(),
        name: input.name,
        phone: input.phone,
        email: input.email,
        origin_city: input.origin_city,
        destination: input.destination,
        travel_date: input.travel_date,
        travelers: input.travelers ?? 2,
        state: input.state,
        budget_range: input.budget_range,
        notes: input.notes,
      })
      .select("id, status, created_at")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Lead created: ${data.id}` }],
      structuredContent: { lead: data },
    };
  },
});
