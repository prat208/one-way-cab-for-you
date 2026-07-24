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

export type BookingCreatedPayload = {
  bookingId: string;
  bookingRef: string;
  customerName: string;
  phone: string;
  email: string | null;
  pickupCity: string;
  dropCity: string;
  pickupDate: string;
  pickupTime: string | null;
  vehicleName: string | null;
  tripType: string;
  estimatedFare: number | null;
  distanceKm: number | null;
  notes: string | null;
  createdAt: string;
};

export type NotificationEvent =
  | { type: "lead.created"; payload: LeadCreatedPayload }
  | { type: "booking.created"; payload: BookingCreatedPayload };

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (event.type === "lead.created") {
      const p = event.payload;
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
      return;
    }
    if (event.type === "booking.created") {
      const p = event.payload;
      const rows = recipients.map((r) => ({
        recipient_id: r.user_id,
        lead_id: null,
        kind: "booking_created",
        title: `New booking — ${p.bookingRef}`,
        body: `${p.customerName} · ${p.pickupCity} → ${p.dropCity} · ${p.phone}`,
      }));
      if (rows.length === 0) return;
      const { error } = await supabaseAdmin.from("admin_notifications").insert(rows);
      if (error) console.error("[notify:in_app]", error);
    }
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

// Slack: instant team-channel alerts via the Lovable Slack connector.
const slackChannel: Channel = {
  id: "slack",
  isEnabled: () => Boolean(process.env.SLACK_API_KEY && process.env.LOVABLE_API_KEY),
  async send(event) {
    const slackKey = process.env.SLACK_API_KEY!;
    const lovableKey = process.env.LOVABLE_API_KEY!;
    const channel = process.env.SLACK_BOOKINGS_CHANNEL || "#bookings";

    const text =
      event.type === "lead.created"
        ? `🚕 New lead — *${event.payload.name}* · ${event.payload.phone} · ${event.payload.city}`
        : `🚕 New booking — *${event.payload.bookingRef}* · ${event.payload.customerName} · ${event.payload.phone}`;

    const blocks =
      event.type === "booking.created"
        ? [
            {
              type: "header",
              text: { type: "plain_text", text: `🚕 New booking ${event.payload.bookingRef}`, emoji: true },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Customer:*\n${event.payload.customerName}` },
                { type: "mrkdwn", text: `*Phone:*\n${event.payload.phone}` },
                { type: "mrkdwn", text: `*Email:*\n${event.payload.email || "—"}` },
                { type: "mrkdwn", text: `*Trip:*\n${event.payload.tripType}` },
                { type: "mrkdwn", text: `*Route:*\n${event.payload.pickupCity} → ${event.payload.dropCity}` },
                { type: "mrkdwn", text: `*Date:*\n${event.payload.pickupDate}${event.payload.pickupTime ? ` at ${event.payload.pickupTime}` : ""}` },
                { type: "mrkdwn", text: `*Vehicle:*\n${event.payload.vehicleName || "—"}` },
                {
                  type: "mrkdwn",
                  text: `*Fare:*\n${event.payload.estimatedFare != null ? `₹${Number(event.payload.estimatedFare).toLocaleString("en-IN")}` : "—"}`,
                },
                { type: "mrkdwn", text: `*Distance:*\n${event.payload.distanceKm != null ? `${event.payload.distanceKm} km` : "—"}` },
              ],
            },
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `Notes: ${event.payload.notes || "—"}` },
              ],
            },
          ]
        : [
            {
              type: "header",
              text: { type: "plain_text", text: `🚕 New lead — ${event.payload.name}`, emoji: true },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Phone:*\n${event.payload.phone}` },
                { type: "mrkdwn", text: `*Email:*\n${event.payload.email}` },
                { type: "mrkdwn", text: `*City:*\n${event.payload.city}${event.payload.state ? `, ${event.payload.state}` : ""}` },
                { type: "mrkdwn", text: `*Coupon:*\n${event.payload.couponCode}` },
              ],
            },
          ];

    try {
      const res = await fetch("https://connector-gateway.lovable.dev/slack/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": slackKey,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ channel, text, blocks }),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error(`[notify:slack] ${res.status}: ${body}`);
        return;
      }
      try {
        const result = JSON.parse(body) as { ok?: boolean; error?: string };
        if (!result.ok) {
          console.error(`[notify:slack] Slack rejected message for ${channel}: ${result.error || body}`);
        }
      } catch {
        console.error(`[notify:slack] Unexpected Slack response: ${body}`);
      }
    } catch (e) {
      console.error("[notify:slack]", e);
    }
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

// WhatsApp Cloud API: official Meta API for admin booking alerts.
// Requires a pre-approved template named "new_booking_alert" with 5 body variables.
const whatsappChannel: Channel = {
  id: "whatsapp",
  isEnabled: () =>
    Boolean(
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_ADMIN_RECIPIENT,
    ),
  async send(event) {
    if (event.type !== "booking.created") return;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const token = process.env.WHATSAPP_ACCESS_TOKEN!;
    const to = process.env.WHATSAPP_ADMIN_RECIPIENT!;
    const p = event.payload;
    const route = `${p.pickupCity} → ${p.dropCity}`;

    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: "new_booking_alert",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: p.customerName },
              { type: "text", text: p.bookingRef },
              { type: "text", text: route },
              { type: "text", text: p.phone },
              { type: "text", text: p.pickupDate },
            ],
          },
        ],
      },
    };

    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const responseText = await res.text();
      if (!res.ok) {
        console.error(`[notify:whatsapp] ${res.status}: ${responseText}`);
        return;
      }
      try {
        const result = JSON.parse(responseText) as {
          messages?: [{ id?: string }];
          error?: { message?: string; error_user_msg?: string };
        };
        if (result.error) {
          console.error(
            `[notify:whatsapp] Meta rejected message: ${result.error.message || responseText}`,
          );
        } else {
          console.log(`[notify:whatsapp] sent message id ${result.messages?.[0]?.id}`);
        }
      } catch {
        console.error(`[notify:whatsapp] Unexpected Meta response: ${responseText}`);
      }
    } catch (e) {
      console.error("[notify:whatsapp]", e);
    }
  },
};

// Generic webhook: POSTs the full event as JSON to BOOKING_WEBHOOK_URL.
// Ideal for n8n, Zapier, Make, or any custom HTTP endpoint.
const webhookChannel: Channel = {
  id: "webhook",
  isEnabled: () => Boolean(process.env.BOOKING_WEBHOOK_URL),
  async send(event) {
    const url = process.env.BOOKING_WEBHOOK_URL!;
    const secret = process.env.BOOKING_WEBHOOK_SECRET;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "OneWayCabs-Webhook/1.0",
          ...(secret ? { "X-Webhook-Secret": secret } : {}),
        },
        body: JSON.stringify({
          event: event.type,
          sentAt: new Date().toISOString(),
          data: event.payload,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error(`[notify:webhook] ${res.status}: ${text}`);
      } else {
        console.log(`[notify:webhook] delivered ${event.type} → ${res.status}`);
      }
    } catch (e) {
      console.error("[notify:webhook]", e);
    }
  },
};

const CHANNELS: Channel[] = [
  inAppChannel,
  emailChannel,
  slackChannel,
  telegramChannel,
  whatsappChannel,
  webhookChannel,
];

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
