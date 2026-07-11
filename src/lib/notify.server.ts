// Pluggable admin notification dispatcher.
// Channels register here; adding a new channel (Telegram, Slack, SMS)
// is one file that exports a Channel and is added to CHANNELS below.

export type LeadCreatedPayload = {
  leadId: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string | null;
  couponCode: string;
  loginMethod: "email" | "phone" | "oauth";
  submittedAt: string;
};

export type NotificationEvent =
  | { type: "lead.created"; payload: LeadCreatedPayload };

export type Channel = {
  id: string;
  isEnabled: () => boolean;
  send: (event: NotificationEvent, recipients: AdminRecipient[]) => Promise<void>;
};

export type AdminRecipient = { user_id: string; email: string | null };

// ---------- Channels ----------

// In-app: writes a row per admin into admin_notifications; the frontend
// bell + /admin/leads subscribe to it in realtime.
const inAppChannel: Channel = {
  id: "in_app",
  isEnabled: () => true,
  async send(event, recipients) {
    if (event.type !== "lead.created") return;
    const p = event.payload;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = recipients.map((r) => ({
      recipient_id: r.user_id,
      lead_id: p.leadId,
      kind: "lead_created",
      title: `New lead — ${p.name}`,
      body: `${p.city}${p.state ? ", " + p.state : ""} · ${p.phone} · coupon ${p.couponCode}`,
    }));
    if (rows.length === 0) return;
    const { error } = await supabaseAdmin.from("admin_notifications").insert(rows);
    if (error) console.error("[notify:in_app]", error);
  },
};

// Email: no-op stub until a sender domain is configured.
// When Lovable Emails is set up, swap the body to enqueue via
// supabase.rpc('enqueue_email', ...) — no callers change.
const emailChannel: Channel = {
  id: "email",
  isEnabled: () => false,
  async send() {
    /* stub */
  },
};

// Telegram: placeholder — enable by setting TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID.
const telegramChannel: Channel = {
  id: "telegram",
  isEnabled: () =>
    Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID),
  async send(event) {
    if (event.type !== "lead.created") return;
    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID!;
    const p = event.payload;
    const text =
      `🚕 *New lead*\n\n` +
      `*${p.name}*\n📞 ${p.phone}\n✉️ ${p.email}\n📍 ${p.city}${p.state ? ", " + p.state : ""}\n` +
      `🎟 Coupon: \`${p.couponCode}\`\n🕒 ${new Date(p.submittedAt).toLocaleString()}`;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      });
    } catch (e) {
      console.error("[notify:telegram]", e);
    }
  },
};

const CHANNELS: Channel[] = [inAppChannel, emailChannel, telegramChannel];

export async function dispatch(event: NotificationEvent): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: adminRoles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  const ids = (adminRoles ?? []).map((r) => r.user_id);
  let recipients: AdminRecipient[] = [];
  if (ids.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email:full_name")
      .in("id", ids);
    recipients = ids.map((id) => {
      const p = profiles?.find((x) => x.id === id);
      return { user_id: id, email: (p as { email?: string | null } | undefined)?.email ?? null };
    });
  }
  await Promise.all(
    CHANNELS.filter((c) => c.isEnabled()).map((c) =>
      c.send(event, recipients).catch((e) => console.error(`[notify:${c.id}]`, e)),
    ),
  );
}
