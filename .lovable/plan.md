## What's already live
Landing pages + city hero, booking wizard (guest inserts to `bookings`), OTP + Google auth, `_authenticated/dashboard` with role-aware list (admin/driver/customer), `_authenticated/customer` hub, AI chat, seeded cities / vehicles / routes, RLS + `has_role` + `handle_new_user` (defaults new users to `customer`).

## What's missing to launch a real, admin-run cab platform

### 1. Driver + admin onboarding
- **Driver signup page** (`/driver/signup`) — form collects name, phone, license number, plus car details. Creates auth user with `raw_user_meta_data.requested_role = 'driver'`, then on first sign-in inserts a `driver_vehicles` row (status `pending_approval`).
- **Hidden admin signup** (`/admin-signup?key=…`) — reads `ADMIN_SIGNUP_PASSCODE` env var via a `createServerFn`, verifies passcode, then grants `admin` role to the current signed-in user.
- Keep `/auth` for customers unchanged (OTP + Google).

### 2. Fleet model (driver-owned + admin fleet)
New table `driver_vehicles` (make, model, year, plate, seats, category, color, RC/insurance URLs, `driver_id`, `status: pending|approved|rejected|inactive`, `notes`). Keeps existing `vehicles` catalog for admin-priced classes. Booking wizard shows: admin classes for pricing quote; assignment picks either an admin-fleet vehicle or an approved driver's car.

### 3. Admin console (`/_authenticated/admin/*`)
Tabbed pages:
- **Bookings** – filter by status/date, assign driver, change status, print voucher.
- **Drivers** – list of drivers + their `driver_vehicles`, approve / reject / suspend.
- **Fleet** – CRUD on admin `vehicles` (price/km, base fare, active).
- **Cities & Routes** – CRUD on `cities` and `routes` with map of pricing.
- **Users** – grant/revoke admin or driver role (uses `user_roles` table).
All gated by `has_role(uid,'admin')` in a `_authenticated/_admin` layout with `beforeLoad` redirect.

### 4. Driver console (`/_authenticated/driver/*`)
- **My cabs** – submit / edit vehicle, see approval status.
- **My trips** – trips assigned to `driver_id`, mark on-the-way / picked-up / completed.
- **Availability toggle** – simple online/offline flag on the driver profile.

### 5. Email notifications (Lovable Emails)
On booking insert and status change:
- customer: booking confirmed / driver assigned / status update
- admin: new booking alert
- driver: trip assigned
Rendered with `@react-email/components`, enqueued via `enqueue_email`. In-app toast + dashboard badge covers the rest.

### 6. Payments (accept everything)
Wire Lovable's built-in Stripe payments. Add a `payments` table (booking_id, amount, method, status, provider_ref). Booking wizard end-step offers: **Pay full online**, **Pay 20% deposit online**, or **Pay driver after ride** (cash/UPI). Deposit + full flows create a Stripe Checkout session; webhook at `/api/public/webhooks/stripe` (HMAC-verified) updates `payments` + `bookings.payment_status`.

### 7. Booking flow polish
- Server-side fare calc via existing `booking.functions.ts` (already there) — make it authoritative (don't trust client fare).
- Public route `/track/:ref` uses existing `lookup_booking` RPC so customers can track without login.
- SMS-lite fallback: booking-ref pill + copy button after submission.
- Rate-limit guest inserts: require reCAPTCHA-free simple check — max 5 bookings/hour per IP via a `guest_booking_throttle` table + trigger.

### 8. SEO & launch hygiene
- Real `head()` per city / route.
- `robots.txt` + `sitemap.xml` server routes.
- Set app-wide title & description in `__root.tsx` (remove "Lovable App" defaults).
- 404 + error boundaries on every loader route.
- Security scan → resolve criticals → publish.

### 9. Secrets to add
- `ADMIN_SIGNUP_PASSCODE` (generated)
- `SESSION_SECRET` (generated, for future signed cookies)
- Stripe keys handled by `enable_stripe_payments` tool
- Lovable Emails handled by `email_domain--setup_email_infra`

## Technical outline

```text
migrations/
  add driver_vehicles, payments, guest_booking_throttle
  add trigger: enforce max 5 guest bookings/hour/ip
  add RLS policies (driver sees own vehicle+trips; admin sees all)
  add GRANTs for authenticated + service_role

src/routes/
  driver.signup.tsx                  (public)
  admin-signup.tsx                   (public, passcode-gated server fn)
  track.$ref.tsx                     (public, uses lookup_booking)
  _authenticated/driver/
    route.tsx  (gate: has_role driver)
    index.tsx  (trips)
    vehicle.tsx (register/edit cab)
  _authenticated/_admin/
    route.tsx  (gate: has_role admin)
    index.tsx  bookings.tsx drivers.tsx fleet.tsx routes.tsx users.tsx
  api/public/webhooks/stripe.ts

src/lib/
  admin.functions.ts  driver.functions.ts  payments.functions.ts
  emails/            (react-email templates)
```

## Order of work
1. Migration: `driver_vehicles`, `payments`, throttling, policies, GRANTs.
2. Driver signup + driver console + admin approval UI.
3. Admin console (bookings, drivers, fleet, users).
4. Hidden admin signup with passcode.
5. Lovable Emails setup + notification server functions.
6. Stripe payments enablement + checkout + webhook.
7. Public `/track/:ref`, SEO metadata, sitemap, 404s.
8. Security scan, then publish.

## Out of scope (say so, don't build)
- WhatsApp/SMS (skipped per your answer).
- Native mobile app.
- Real-time driver GPS tracking (needs a mapping provider + realtime channel — happy to add later).
