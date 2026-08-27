import { createServerFn } from "@tanstack/react-start";
import { dispatch } from "@/lib/notify.server";

export const testTelegramNotify = createServerFn({ method: "POST" }).handler(async () => {
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
  return { ok: true };
});
