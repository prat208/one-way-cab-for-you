import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------- env loading (no dotenv dep) ----------
function loadEnv(): Record<string, string> {
  const out: Record<string, string> = { ...process.env } as Record<string, string>;
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const [, k, v] = m;
      if (!out[k]) out[k] = v.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    }
  } catch {
    /* .env optional */
  }
  return out;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SERVICE_ROLE) {
  throw new Error(
    "Missing Supabase env. Need SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function storageKey(): string {
  const ref = new URL(SUPABASE_URL!).host.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function createTestUser() {
  const stamp = Date.now();
  const email = `e2e+${stamp}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = `Test-${stamp}-Aa1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "E2E Tester", phone: "+15555550100" },
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  return { email, password, userId: data.user.id };
}

async function signIn(email: string, password: string) {
  const client = createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`signIn failed: ${error?.message}`);
  return data.session;
}

async function injectSession(page: Page, session: unknown) {
  const key = storageKey();
  await page.goto("/");
  await page.evaluate(
    ([k, s]) => window.localStorage.setItem(k as string, s as string),
    [key, JSON.stringify(session)],
  );
}

async function cleanupUser(userId: string) {
  const { data: lead } = await admin.from("leads").select("id").eq("user_id", userId).maybeSingle();
  if (lead?.id) await admin.from("coupons").delete().eq("lead_id", lead.id);
  await admin.from("leads").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId).catch(() => undefined);
}

test.describe.configure({ mode: "serial" });

test.describe("Lead → Coupon flow", () => {
  let user: { email: string; password: string; userId: string };

  test.beforeAll(async () => {
    user = await createTestUser();
  });

  test.afterAll(async () => {
    if (user?.userId) await cleanupUser(user.userId);
  });

  test("submits lead, generates coupon, and navigates to /coupon", async ({ page }) => {
    const session = await signIn(user.email, user.password);
    await injectSession(page, session);

    // Go to the lead form.
    await page.goto("/lead");
    await expect(page.getByRole("heading", { name: /tell us a bit about you/i })).toBeVisible({
      timeout: 15_000,
    });

    // Fill by explicit input ordering — label wraps input without htmlFor,
    // so we scope each fill to the label containing the field name.
    const fillField = async (labelText: string, value: string) => {
      const input = page.locator("label", { hasText: new RegExp(`^${labelText}\\b`, "i") }).locator("input").first();
      await input.fill(value);
    };
    await fillField("Full name", "E2E Tester");
    await fillField("Mobile number", "+15555550100");
    await fillField("Email", user.email);
    await fillField("City", "Mumbai");
    await fillField("State", "MH");

    await Promise.all([
      page.waitForURL(/\/coupon(\?|$)/, { timeout: 30_000 }),
      page.getByRole("button", { name: /get my coupon/i }).click(),
    ]);

    // The coupon page renders CAB-XXXXXX in an <svg><text/></svg>.
    const codeLocator = page.locator("svg text").filter({ hasText: /^CAB-[A-Z2-9]{6}$/ }).first();
    await expect(codeLocator).toBeVisible({ timeout: 20_000 });
    const codeText = (await codeLocator.textContent())?.trim() ?? "";
    expect(codeText).toMatch(/^CAB-[A-Z2-9]{6}$/);

    // Verify DB state.
    const { data: lead } = await admin
      .from("leads")
      .select("id, name, origin_city, status")
      .eq("user_id", user.userId)
      .single();
    expect(lead).toBeTruthy();
    expect(lead!.name).toBe("E2E Tester");
    expect(lead!.status).toBe("new");

    const { data: coupon } = await admin
      .from("coupons")
      .select("code, discount_pct")
      .eq("lead_id", lead!.id)
      .single();
    expect(coupon?.code).toBe(codeText);
    expect(coupon?.discount_pct).toBeGreaterThan(0);
  });

  test("re-visiting /lead after submission redirects to /coupon", async ({ page }) => {
    const session = await signIn(user.email, user.password);
    await injectSession(page, session);

    // Land on /lead — the page's effect calls getMyLead and redirects to /coupon.
    await page.goto("/lead");
    await page.waitForURL(/\/coupon(\?|$)/, { timeout: 30_000 });
    await expect(
      page.locator("svg text").filter({ hasText: /^CAB-[A-Z2-9]{6}$/ }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
