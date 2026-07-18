import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyBookings from "./tools/list_my_bookings";
import listMyCoupons from "./tools/list_my_coupons";
import createTravelLead from "./tools/create_travel_lead";

// The OAuth issuer must be the direct Supabase host. Read the project ref
// from the Vite-inlined env; SUPABASE_URL is rewritten on publish and would
// fail RFC 8414 issuer verification.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "one-way-cab-mcp",
  title: "ONE WAY CAB — Agent tools",
  version: "0.1.0",
  instructions:
    "Tools for ONE WAY CAB. Use `list_my_bookings` to see the signed-in user's cab bookings, `list_my_coupons` to see coupons they have been issued, and `create_travel_lead` to submit a new travel enquiry on their behalf.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMyBookings, listMyCoupons, createTravelLead],
});
