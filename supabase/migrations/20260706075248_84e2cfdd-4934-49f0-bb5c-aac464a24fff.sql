
CREATE TABLE public.driver_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year int,
  plate text NOT NULL,
  seats int NOT NULL DEFAULT 4,
  category text NOT NULL DEFAULT 'sedan',
  color text,
  rc_url text,
  insurance_url text,
  license_number text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plate)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_vehicles TO authenticated;
GRANT ALL ON public.driver_vehicles TO service_role;
ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers manage own vehicles" ON public.driver_vehicles
  FOR ALL TO authenticated
  USING (driver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (driver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER driver_vehicles_updated
  BEFORE UPDATE ON public.driver_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  method text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'pending',
  provider_ref text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own booking payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND (b.user_id = auth.uid() OR b.driver_id = auth.uid())
    )
  );
CREATE POLICY "Admin manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.guest_booking_throttle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.guest_booking_throttle TO anon, authenticated;
GRANT ALL ON public.guest_booking_throttle TO service_role;
ALTER TABLE public.guest_booking_throttle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can throttle-insert" ON public.guest_booking_throttle
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX guest_booking_throttle_ip_time ON public.guest_booking_throttle(ip, created_at);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS driver_vehicle_id uuid REFERENCES public.driver_vehicles(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;
