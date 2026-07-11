
# Lead-First Cab Booking — Implementation Plan

Layer a lead-capture / coupon / CRM system on top of the existing cab site. **No redesign** — existing pages, hero, wizard, and styling stay exactly as they are. We only gate the fare view and add admin CRM screens.

---

## 1. Customer flow (grafted onto existing site)

```text
Landing (unchanged)
   │  click "See fares" / "Book a cab" / any package price
   ▼
Auth (existing /auth — email OTP + Google)   ← already works
   ▼
/lead   (mandatory one-page form — skipped if a lead already exists this session)
   ├── Full name, mobile, email (prefilled), city, state, notes
   └── on submit → create lead + unique coupon + fire notifications
   ▼
/coupon (full-screen coupon card — download PNG, share WhatsApp/Email)
   ▼
Rates are now unlocked everywhere for this user (server-checked)
   • /routes fare table shows numbers
   • Package prices reveal
   • Booking wizard proceeds normally
```

- Rates = cab ride fares (existing `routes` / `packages`), not gold/silver.
- "Unlocked" is a **server-side gate**: any fare/price endpoint requires the caller to have a lead row.
- Duplicate protection: one active lead per `user_id`. Re-submitting updates the existing lead instead of creating a new coupon.

---

## 2. Database changes

Extend the existing `leads` and `coupons` tables (from the last migration) — do not recreate.

`leads` — add columns:
- `state text`
- `status text` default `'new'` — enum-checked: `new | contacted | negotiation | follow_up | converted | lost`
- `assigned_to uuid` (admin user)
- `follow_up_at timestamptz`
- `last_contacted_at timestamptz`
- unique index on `user_id` (one lead per customer; upsert on resubmit)

New table `lead_notes` — timeline entries (note / call / status_change), fields: `lead_id`, `author_id`, `kind`, `body`, `created_at`. RLS: admins read/write all; customer can't see.

New table `admin_notifications` — in-app feed for admins. Fields: `id`, `recipient_id`, `lead_id`, `title`, `body`, `read_at`, `created_at`. RLS: recipient reads own; service role inserts.

`coupons` already has `code` + unique constraint — keep. Generation is server-side (`CAB-XXXXXX` base32, retry on collision).

All new columns/tables include GRANTs + RLS in the same migration.

---

## 3. Server functions (`createServerFn`, TanStack Start)

`src/lib/leads.functions.ts`
- `submitLead(input)` — auth-gated, zod-validated. Upserts lead by `user_id`, creates coupon if none, dispatches notifications, returns `{ leadId, coupon }`.
- `getMyLead()` — returns current user's lead + coupon (used to decide if rates should be shown).
- `listLeads({ q, status, assigned_to, from, to, page })` — admin only, paginated.
- `updateLead({ id, patch })` — admin only, adds `lead_notes` row for status changes.
- `addLeadNote({ leadId, kind, body })` — admin only.
- `assignLead({ leadId, adminId })` — admin only.
- `exportLeadsCsv(filter)` — admin only, returns CSV string (Excel-openable).

`src/lib/rates.functions.ts`
- `getPublicRates()` — returns rates **masked** unless caller has a lead.
- Existing package / route price reads gain the same gate.

`src/lib/notifications.functions.ts` + `src/lib/notify/*.server.ts`
- Pluggable dispatcher: `dispatch(event, payload)` iterates over enabled channels.
- Channels shipped now: **in-app** (insert into `admin_notifications` for every admin) + **email** (Lovable Emails to admin recipients).
- Adapter interface `Channel { id, isEnabled(), send(payload) }` so Telegram/Slack/SMS drop in later as new files without touching callers.
- Recipient list = users with role `admin`.

Email is sent via Lovable Emails. Requires a verified sender domain — plan surfaces the setup dialog if not configured yet.

---

## 4. Routes (files under `src/routes/`)

Customer-facing (public shell, gate is server-side):
- `_authenticated/lead.tsx` — mandatory form; redirects to `/coupon` on success, or to `/coupon` if lead already exists.
- `_authenticated/coupon.tsx` — SVG coupon card, "Download PNG" (canvas), "Send on WhatsApp" (`wa.me` deep link), "Email me" (server fn re-sends).
- `routes.tsx` / `packages` sections — read `getMyLead()`; if absent show a soft "Get today's fares — takes 20s" CTA linking to `/lead`. UI otherwise untouched.

Admin CRM (`_authenticated/admin/…`, gated by `has_role(auth.uid(), 'admin')`):
- `admin/leads.tsx` — live feed (Supabase realtime on `leads` + `admin_notifications`), search box, filters (status, assigned, date range), row → drawer.
- `admin/leads.$id.tsx` — detail panel: customer info, coupon code, status dropdown, assignee picker, follow-up datetime, notes timeline, "Log call" button.
- `admin/leads.export` — server route returning `text/csv` (works from a plain `<a href>`).
- A bell in the existing admin nav shows unread `admin_notifications` count with a dropdown feed.

Existing routes (`index`, `book`, `dashboard`, other admin tabs) — untouched except: nav gets a "Leads" admin link, and the current admin dashboard tile grid gets one extra card.

---

## 5. Coupon rendering

- Server returns `{ code, issuedAt, validUntil, customerName }`.
- Client renders an SVG card (Outfit heading, brand gold accent, monospace code, subtle watermark) — this file already lives in the design brief; nothing new visually.
- "Download PNG": rasterize via `<canvas>` in-browser, no server round-trip.
- "Send on WhatsApp": opens `https://wa.me/?text=<encoded message + code>` — no Twilio, no API key.
- "Email me": server fn re-enqueues the coupon email to the customer.

---

## 6. Notifications wiring on submit

On `submitLead` success, dispatcher fires event `lead.created` with:
`{ leadId, name, phone, email, city, state, couponCode, submittedAt, loginMethod }`.

Channels this round:
1. **In-app**: insert one `admin_notifications` row per admin. Admin bell + `/admin/leads` live-update via Supabase realtime subscription.
2. **Email**: Lovable Emails template to each admin's email. Subject "New lead — {name} ({city})", body has all fields + a deep link to `/admin/leads/{id}`.

Telegram/Slack/SMS: not built this round. Adapter interface is in place so adding them later is one file + a row in a `notification_channels` config (documented but out of scope now).

---

## 7. Files touched

New:
- `supabase/migrations/<ts>_lead_crm.sql`
- `src/lib/leads.functions.ts`
- `src/lib/rates.functions.ts`
- `src/lib/notifications.functions.ts`
- `src/lib/notify/inapp.server.ts`
- `src/lib/notify/email.server.ts`
- `src/lib/notify/index.server.ts` (dispatcher)
- `src/routes/_authenticated/lead.tsx`
- `src/routes/_authenticated/coupon.tsx`
- `src/routes/_authenticated/admin/leads.tsx`
- `src/routes/_authenticated/admin/leads.$id.tsx`
- `src/routes/_authenticated/admin/leads.export.ts` (server route, CSV)
- `src/components/admin/LeadTable.tsx`, `LeadDetailDrawer.tsx`, `NotesTimeline.tsx`, `AdminBell.tsx`
- `src/components/coupon/CouponCard.tsx`
- Auth email templates for the coupon delivery + new-lead admin alert

Edited (small, additive only — no visual overhaul):
- `src/routes/_authenticated/admin/index.tsx` — add "Leads" tile
- `src/components/landing/Nav.tsx` — add "Admin → Leads" link (admins only)
- Rates/packages read paths — apply lead gate (data-only, no UI change)

Not touched: hero, booking widget, wizard, existing dashboards, styling tokens.

---

## 8. Prerequisites & assumptions

- **Email sender domain** must be set up (Lovable Emails). If not present, the plan surfaces the one-click setup dialog before turning on the email channel; in-app still works without it.
- Admin role already exists (`user_roles` + `has_role`) — reused as-is.
- No Twilio, no external WhatsApp API — customer WhatsApp share uses `wa.me` links; admin notification uses in-app + email now, Telegram next round.
- No SMS-OTP work — existing email OTP + Google login remain the only login methods.
- Duplicate customers are collapsed by `user_id`; a returning customer sees the same coupon.

---

## 9. Verification

- `bunx tsgo --noEmit`
- Manual: sign in (fresh user) → hit `/routes` → redirected to `/lead` gate CTA → submit → land on `/coupon` → confirm coupon visible + downloadable → return to `/routes` → fares now visible.
- Admin: open `/admin/leads` in a second tab → new lead appears live, bell increments, email arrives, CSV export downloads.
- `supabase--linter` after migration.
