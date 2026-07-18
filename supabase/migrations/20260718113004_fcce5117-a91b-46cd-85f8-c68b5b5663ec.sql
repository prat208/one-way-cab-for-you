
-- Revoke EXECUTE from PUBLIC on SECURITY DEFINER functions; grant narrowly
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.lookup_booking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_booking(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten guest_booking_throttle INSERT policy (remove USING/WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can throttle-insert" ON public.guest_booking_throttle;
CREATE POLICY "Guests may insert throttle rows"
  ON public.guest_booking_throttle
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (ip IS NOT NULL AND length(ip) BETWEEN 3 AND 64);

-- Explicit admin-only SELECT for guest_booking_throttle (documents intent)
CREATE POLICY "Admins read throttle"
  ON public.guest_booking_throttle
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow lead_notes authors to read their own notes
CREATE POLICY "Authors read own lead notes"
  ON public.lead_notes
  FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());
