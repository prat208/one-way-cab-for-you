# E2E tests

Playwright tests covering the lead → coupon flow.

## Requirements

- Dev server running: `bun run dev` (defaults to `http://localhost:8080`)
- `.env` has `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  (already provided by Lovable Cloud).

## Run

```bash
bun run test:e2e:install   # first time only — installs Chromium
bun run test:e2e
```

Override the target URL with `E2E_BASE_URL=https://your-preview.lovable.app bun run test:e2e`.

## What it covers

`lead-flow.spec.ts`:

1. Provisions a throw-away user via the Supabase Auth admin API.
2. Signs in and injects the session into `localStorage`, then visits `/lead`.
3. Fills the lead form and submits.
4. Asserts navigation to `/coupon` and that a `CAB-XXXXXX` code renders.
5. Verifies the DB row: `leads.status = "new"` and a linked `coupons` row exists
   whose `code` matches the one shown on screen.
6. Re-visits `/lead` and asserts the app redirects to `/coupon` (idempotent).
7. Cleans up: deletes the lead, coupon, and user after the suite.
