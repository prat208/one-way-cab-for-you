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
  couponCode?: string | null;
  discountPct?: number | null;
  discountAmount?: number | null;
  finalFare?: number | null;
  originLabel?: string | null;
  destinationLabel?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  polyline?: string | null;
  mapUrl?: string | null;
  staticMapUrl?: string | null;
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
        body: `${p.customerName} · ${p.pickupCity} → ${p.dropCity} · ${p.phone}${
          p.couponCode
            ? ` · coupon ${p.couponCode} (−${p.discountPct}%) → ₹${Number(p.finalFare ?? 0).toLocaleString("en-IN")}`
            : ""
        }`,
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
              text: {
                type: "plain_text",
                text: `🚕 New booking ${event.payload.bookingRef}`,
                emoji: true,
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Customer:*\n${event.payload.customerName}` },
                { type: "mrkdwn", text: `*Phone:*\n${event.payload.phone}` },
                { type: "mrkdwn", text: `*Email:*\n${event.payload.email || "—"}` },
                { type: "mrkdwn", text: `*Trip:*\n${event.payload.tripType}` },
                {
                  type: "mrkdwn",
                  text: `*Route:*\n${event.payload.pickupCity} → ${event.payload.dropCity}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Date:*\n${event.payload.pickupDate}${event.payload.pickupTime ? ` at ${event.payload.pickupTime}` : ""}`,
                },
                { type: "mrkdwn", text: `*Vehicle:*\n${event.payload.vehicleName || "—"}` },
                {
                  type: "mrkdwn",
                  text: `*Fare:*\n${event.payload.estimatedFare != null ? `₹${Number(event.payload.estimatedFare).toLocaleString("en-IN")}` : "—"}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Distance:*\n${event.payload.distanceKm != null ? `${event.payload.distanceKm} km` : "—"}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Coupon:*\n${
                    event.payload.couponCode
                      ? `${event.payload.couponCode} (−${event.payload.discountPct}% / ₹${Number(event.payload.discountAmount ?? 0).toLocaleString("en-IN")})`
                      : "—"
                  }`,
                },
                {
                  type: "mrkdwn",
                  text: `*Payable:*\n${event.payload.finalFare != null ? `₹${Number(event.payload.finalFare).toLocaleString("en-IN")}` : "—"}`,
                },
              ],
            },
            {
              type: "context",
              elements: [{ type: "mrkdwn", text: `Notes: ${event.payload.notes || "—"}` }],
            },
          ]
        : [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `🚕 New lead — ${event.payload.name}`,
                emoji: true,
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Phone:*\n${event.payload.phone}` },
                { type: "mrkdwn", text: `*Email:*\n${event.payload.email}` },
                {
                  type: "mrkdwn",
                  text: `*City:*\n${event.payload.city}${event.payload.state ? `, ${event.payload.state}` : ""}`,
                },
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
          console.error(
            `[notify:slack] Slack rejected message for ${channel}: ${result.error || body}`,
          );
        }
      } catch {
        console.error(`[notify:slack] Unexpected Slack response: ${body}`);
      }
    } catch (e) {
      console.error("[notify:slack]", e);
    }
  },
};

// Telegram: full booking/lead details to the admin chat via the Telegram
// Bot API directly. Requires TELEGRAM_BOT_TOKEN (from @BotFather) and
// TELEGRAM_ADMIN_CHAT_ID (chat that receives alerts).
const telegramChannel: Channel = {
  id: "telegram",
  isEnabled: () =>
    Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID),
  async send(event) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID!;

    const esc = (s: unknown) =>
      String(s ?? "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const money = (n: number | null | undefined) =>
      n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

    const text =
      event.type === "lead.created"
        ? `🚕 <b>New lead — ${esc(event.payload.name)}</b>\n\n` +
          `<b>Name:</b> ${esc(event.payload.name)}\n` +
          `<b>Phone:</b> ${esc(event.payload.phone)}\n` +
          `<b>Email:</b> ${esc(event.payload.email)}\n` +
          `<b>City:</b> ${esc(event.payload.city)}${event.payload.state ? `, ${esc(event.payload.state)}` : ""}\n` +
          `<b>Coupon:</b> ${esc(event.payload.couponCode)}\n` +
          `<b>Login:</b> ${esc(event.payload.loginMethod)}\n` +
          `<b>Lead ID:</b> ${esc(event.payload.leadId)}\n` +
          `<b>Submitted:</b> ${esc(new Date(event.payload.submittedAt).toLocaleString("en-IN"))}`
        : (() => {
            const p = event.payload;
            return (
              `🚕 <b>New booking — ${esc(p.bookingRef)}</b>\n\n` +
              `<b>Customer:</b> ${esc(p.customerName)}\n` +
              `<b>Phone:</b> ${esc(p.phone)}\n` +
              `<b>Email:</b> ${esc(p.email)}\n` +
              `<b>Route:</b> ${esc(p.originLabel || p.pickupCity)} → ${esc(p.destinationLabel || p.dropCity)}\n` +
              `<b>Trip type:</b> ${esc(p.tripType)}\n` +
              `<b>Date:</b> ${esc(p.pickupDate)}${p.pickupTime ? ` at ${esc(p.pickupTime)}` : ""}\n` +
              `<b>Vehicle:</b> ${esc(p.vehicleName)}\n` +
              `<b>Distance:</b> ${p.distanceKm != null ? `${p.distanceKm} km` : "—"}\n` +
              `<b>Est. fare:</b> ${money(p.estimatedFare)}\n` +
              `<b>Coupon:</b> ${p.couponCode ? `${esc(p.couponCode)} (−${p.discountPct}% / ${money(p.discountAmount)})` : "—"}\n` +
              `<b>Payable:</b> ${money(p.finalFare)}\n` +
              `<b>Notes:</b> ${esc(p.notes)}\n` +
              `<b>Booking ID:</b> ${esc(p.bookingId)}\n` +
              `<b>Created:</b> ${esc(new Date(p.createdAt).toLocaleString("en-IN"))}` +
              (p.mapUrl ? `\n🗺 <a href="${esc(p.mapUrl)}">Open route in Google Maps</a>` : "")
            );
          })();

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error(`[notify:telegram] ${res.status}: ${body}`);
        return;
      }
      try {
        const result = JSON.parse(body) as { ok?: boolean; description?: string };
        if (!result.ok) {
          console.error(`[notify:telegram] Telegram rejected message: ${result.description || body}`);
        }
      } catch {
        console.error(`[notify:telegram] Unexpected response: ${body}`);
      }
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

// Generic webhook: POSTs the full event as JSON to the n8n intake endpoint.
// Override with BOOKING_WEBHOOK_URL_OVERRIDE if the endpoint ever changes.
const DEFAULT_WEBHOOK_URL =
  "https://primary-production-ea19e.up.railway.app/webhook-test/customer-intake";

const webhookChannel: Channel = {
  id: "webhook",
  isEnabled: () => true,
  async send(event) {
    const url = process.env.BOOKING_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
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
  // webhookChannel — replaced by Telegram alerts
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
