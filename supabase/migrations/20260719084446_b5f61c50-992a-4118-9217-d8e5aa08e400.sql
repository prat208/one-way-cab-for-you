
DROP POLICY IF EXISTS "Guests and customers create safe bookings" ON public.bookings;

CREATE POLICY "Anon can create guest bookings"
  ON public.bookings FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND driver_id IS NULL
    AND driver_vehicle_id IS NULL
    AND status = 'pending'
    AND payment_status = 'unpaid'
  );

CREATE POLICY "Authenticated users create own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND driver_id IS NULL
    AND driver_vehicle_id IS NULL
    AND status = 'pending'
    AND payment_status = 'unpaid'
  );
