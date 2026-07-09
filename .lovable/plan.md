
# Add Travel Agency Lead-Gen — Layered on Existing Cab Site

Keep every existing feature (cab booking, driver console, admin, tracking, chat). Add a parallel **Travel Packages** experience with locked prices, mandatory lead capture, auto-generated coupons, WhatsApp notifications, and an admin leads dashboard. Nothing existing is removed.

## Funnel

```text
Landing (existing hero + NEW "Tour Packages" section with BLURRED prices)
   │
   └─ Click any package / "Unlock prices" CTA
        │
        ├─ Not signed in → /auth  (existing OTP email + Google; unchanged)
        │
        └─ Signed in but no lead yet → /lead (mandatory form)
               │
               ▼
          Submit → server generates unique coupon → redirect /packages
               │
               ├─ Prices revealed
               ├─ Coupon card (SVG) with Copy · Download PNG · WhatsApp share · Email share
               └─ Server: Twilio WhatsApp DM to +919403001415 with lead details
               │
               ▼
     Admin: /_authenticated/admin → "Leads" tab
        search · filter · status · view coupon · Export to Excel (CSV)
        + "Packages" tab (CRUD)
```

Existing `/book`, `/driver/*`, `/track/*`, admin bookings — all untouched. A user can be both a cab customer and a package lead; they're stored in separate tables.

## Database (new migration only)

- `packages` — title, slug, destination, duration_days, price_inr, hero_image, highlights[], itinerary(jsonb), active, sort_order
- `leads` — user_id (fk auth.users), name, phone, email, origin_city, destination, travel_date, travelers, budget_range, notes, status(new|contacted|converted|lost), assigned_to, created_at, updated_at
- `coupons` — lead_id (unique), code (unique, `TRIP-XXXX-XXXX`), discount_pct, valid_until, created_at

RLS + GRANTs (in same migration):
- `packages`: public SELECT where `active`; admin ALL
- `leads`: user reads/inserts own; admin ALL
- `coupons`: user reads own via lead join; admin ALL

## Server functions

- `src/lib/leads.functions.ts`
  - `submitLead(data)` — auth-required; zod-validated; insert lead, generate coupon (`TRIP-` + 8 base32 chars from `crypto.randomUUID`), insert coupon, fire `notifyAdminWhatsApp` inside handler (best-effort, non-blocking), return `{lead, coupon}`
  - `getMyLead()` — returns current user's lead + coupon or null (used to gate reveal)
  - `listLeads(filters)` — admin only; search + status + date range + destination
  - `updateLeadStatus(id, status)` — admin only
  - `exportLeadsCsv()` — admin only; returns CSV text; opens in Excel natively
- `src/lib/packages.functions.ts`
  - `listPackages()` — public; returns array WITHOUT `price_inr` when caller has no lead; WITH price when they do (server-side gate — client can't spoof)
  - `upsertPackage`, `togglePackage`, `deletePackage` — admin only
- `src/lib/notify.server.ts` (server-only) — Twilio WhatsApp send via connector gateway to `whatsapp:+919403001415`. Errors logged, never thrown into user flow.

## Routes (new)

- `src/routes/packages.tsx` — public page, price locked with 🔒 chip + "Unlock prices" CTA → AuthLink to `/lead`
- `src/routes/_authenticated/lead.tsx` — mandatory form (name, phone, email, origin city, destination, travel date, travelers, budget range dropdown, notes). Zod client + server validation. On submit: call `submitLead` → navigate to `/packages?revealed=1`
- `src/routes/_authenticated/coupon.tsx` — full-page coupon: SVG rendered inline (brand gradient, name, code, valid-until, watermark) + Copy · Download PNG (client `canvas` from SVG) · Share on WhatsApp (`wa.me?text=...` prefilled) · Email (mailto: prefilled)
- `src/routes/_authenticated/admin.tsx` — add tabs shell: existing Bookings/Drivers/Fleet/Users + NEW **Leads**, **Packages**

## Existing files touched (minimal)

- `src/routes/index.tsx` — add a **"Tour Packages"** section between existing sections; shows package cards with 🔒 blurred prices for signed-out/no-lead users
- `src/components/landing/Nav.tsx` — add "Packages" link
- `src/routes/_authenticated/dashboard.tsx` — if lead exists, add "Your coupon" card linking to `/coupon`
- No changes to auth, cab booking, driver, tracking, chat.

## WhatsApp — Twilio (user chose Twilio API)

Twilio connector via connector gateway. Requires:
1. Link Twilio connector → gives `TWILIO_API_KEY` env var
2. Enable **WhatsApp sandbox** (works instantly, sender `whatsapp:+14155238886`) OR use a Meta-approved business sender (3–7 day approval)
3. Save Twilio "from" number to secret `TWILIO_WHATSAPP_FROM`
4. Admin target hard-set to `whatsapp:+919403001415` in secret `ADMIN_WHATSAPP_TO` (editable later)

Admin message template:
```
🆕 New Travel Lead
{name}  ·  {phone}
✉ {email}
📍 {origin_city} → {destination}
🗓 {travel_date}  ·  👥 {travelers}
💰 {budget_range}
Coupon: {code}
Notes: {notes}
```

Customer-side WhatsApp share is `wa.me` deep link — no API cost, no approval needed.

## Coupon image

Server returns lead+coupon; client renders an SVG coupon card (Outfit display font, brand gradient, code in monospace, valid-until, small watermark). "Download PNG" uses browser `<canvas>` to rasterize the SVG. "Send via WhatsApp" opens `wa.me` with prefilled message + coupon code. "Send via Email" opens `mailto:` prefilled. No native image libs, Worker-safe.

## Admin — Leads tab

Table columns: created · name · phone · email · origin → dest · date · travelers · budget · coupon · status. Controls: search box (name/phone/email), status dropdown, destination filter, date range, "Export to Excel" (downloads `leads.csv` from `exportLeadsCsv`). Row actions: view detail drawer, change status, copy coupon, "Resend WhatsApp" button.

## SMS OTP note

Existing `/auth` uses **email OTP + Google**. User asked for "mobile OTP or email verification". Enabling Supabase phone provider needs Twilio SMS credentials configured in Supabase Auth settings (separate from connector). **Turn 1 ships email OTP + Google** (already works). Once you're happy, say the word and I'll wire SMS-OTP in a follow-up.

## Secrets & prerequisites (build mode will handle)

- Link **Twilio** connector → auto-provides `TWILIO_API_KEY`
- `TWILIO_WHATSAPP_FROM` — you provide after Twilio linked (I'll prompt)
- `ADMIN_WHATSAPP_TO` = `whatsapp:+919403001415` (set via `set_secret`, no interaction)
- `LOVABLE_API_KEY` — already present

## Order of work

1. Migration: `packages`, `leads`, `coupons` + RLS + GRANTs + seed 8 sample packages
2. Server fns: `leads.functions.ts`, `packages.functions.ts`, `notify.server.ts`
3. Link Twilio connector + collect `TWILIO_WHATSAPP_FROM`
4. Routes: `/packages`, `/_authenticated/lead`, `/_authenticated/coupon`
5. Add Leads + Packages tabs to admin, wire CSV export
6. Landing page: add Tour Packages section with lock/reveal state
7. Nav + dashboard tweaks
8. Typecheck → screenshot QA → publish

## Out of scope (say so, don't build)

- SMS-OTP login (Supabase phone provider) — email OTP + Google today
- Automatic coupon redemption / discount enforcement on cab bookings — code is a reference for the sales team to honour manually
- Payments — leads only, no checkout

## Confirm before I build

1. **Twilio sandbox for now?** (works instantly; each admin phone must once send `join <sandbox-word>` from WhatsApp — I'll walk you through). Or wait for business sender.
2. **Coupon discount** — should the code carry a stated `discount_pct` (e.g. 10%) or just be a reference tag? I'll default to 10% off if unspecified.
3. **Landing placement** — new Tour Packages section between "Popular Routes" and existing sections is fine? Or as its own top-level `/packages` page linked from nav only?
