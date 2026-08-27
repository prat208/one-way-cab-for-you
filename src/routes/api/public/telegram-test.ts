import { createFileRoute } from "@tanstack/react-router";
import { dispatch } from "@/lib/notify.server";

export const Route = createFileRoute("/api/public/telegram-test")({
  server: {
    handlers: {
      GET: async () => {
        const token = process.env.TELEGRAM_BOT_TOKEN!;
        const upd = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        const updJson = (await upd.json()) as {
          ok: boolean;
          result?: Array<{ message?: { chat?: { id?: number; first_name?: string } } }>;
        };
        const chats = (updJson.result ?? [])
          .map((u) => u.message?.chat)
          .filter(Boolean)
          .map((c) => ({ id: c!.id, name: c!.first_name }));
        await dispatch({
          type: "booking.created",
          payload: {
            bookingId: "test-direct-bot",
            bookingRef: "TG-DIRECT-001",
            customerName: "Test Customer",
            phone: "9999999999",
            email: "test@example.com",
            pickupCity: "Kolhapur",
            dropCity: "Pune",
            pickupDate: "2026-08-30",
            pickupTime: "09:00",
            vehicleName: "Sedan",
            tripType: "one_way",
            estimatedFare: 3900,
            distanceKm: 230,
            notes: "Direct bot-token connection test",
            createdAt: new Date().toISOString(),
            couponCode: null,
            discountPct: null,
            discountAmount: null,
            finalFare: 3900,
            mapUrl: "https://maps.google.com/?saddr=Kolhapur&daddr=Pune",
          },
        });
        return Response.json({ ok: true, chats });
      },
    },
  },
});
