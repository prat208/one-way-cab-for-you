
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;

CREATE POLICY "Guests and customers create safe bookings" ON public.bookings
  FOR INSERT
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND driver_id IS NULL
    AND driver_vehicle_id IS NULL
    AND status = 'pending'
    AND payment_status = 'unpaid'
  );
