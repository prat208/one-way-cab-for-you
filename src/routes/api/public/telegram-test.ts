import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram-test")({
  server: {
    handlers: {
      GET: async () => {
        const token = process.env.TELEGRAM_BOT_TOKEN!;
        const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID!;
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "🚕 <b>Connection test</b>\n\nYour Telegram bot token is now connected directly. Booking alerts will arrive here.",
            parse_mode: "HTML",
          }),
        });
        const json = (await res.json()) as { ok: boolean; description?: string; result?: { message_id?: number } };
        return Response.json({
          status: res.status,
          ok: json.ok,
          message_id: json.result?.message_id,
          description: json.description,
          channelEnabled: Boolean(token && chatId),
        });
      },
    },
  },
});
