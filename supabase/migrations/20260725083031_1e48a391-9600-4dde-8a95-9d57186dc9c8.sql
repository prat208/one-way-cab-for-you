
-- 1) Revoke EXECUTE on SECURITY DEFINER trigger functions from public/anon/authenticated
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten lookup_booking and has_role: revoke from PUBLIC, grant only to roles that need it
REVOKE ALL ON FUNCTION public.lookup_booking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_booking(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2) Restrict routes SELECT: public sees only popular; admins see all
DROP POLICY IF EXISTS "Public can view routes" ON public.routes;
CREATE POLICY "Public can view popular routes"
  ON public.routes FOR SELECT
  TO anon, authenticated
  USING (is_popular = true);
CREATE POLICY "Admins can view all routes"
  ON public.routes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Explicit admin-only DELETE policy for bookings
CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
