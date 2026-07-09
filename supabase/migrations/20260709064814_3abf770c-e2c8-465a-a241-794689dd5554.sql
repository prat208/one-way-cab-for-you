
-- =========================================
-- PACKAGES
-- =========================================
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 3,
  price_inr INTEGER NOT NULL DEFAULT 0,
  hero_image TEXT,
  highlights TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage packages"
  ON public.packages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER packages_updated_at BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- LEADS
-- =========================================
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date DATE NOT NULL,
  travelers INTEGER NOT NULL DEFAULT 2,
  budget_range TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leads_user_id_idx ON public.leads (user_id);
CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX leads_status_idx ON public.leads (status);

GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- COUPONS
-- =========================================
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_pct INTEGER NOT NULL DEFAULT 10,
  valid_until DATE NOT NULL DEFAULT (now()::date + INTERVAL '60 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX coupons_lead_id_idx ON public.coupons (lead_id);

GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = coupons.lead_id AND l.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================
-- SEED PACKAGES
-- =========================================
INSERT INTO public.packages (slug, title, destination, duration_days, price_inr, hero_image, highlights, sort_order) VALUES
  ('goa-beach-escape', 'Goa Beach Escape', 'Goa', 4, 18999, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200', ARRAY['Beachfront resort','Sunset cruise','Guided old-Goa tour','All breakfasts'], 10),
  ('kerala-backwaters', 'Kerala Backwaters & Munnar', 'Kerala', 6, 32999, 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200', ARRAY['Houseboat night','Munnar tea gardens','Ayurveda spa','Airport transfers'], 20),
  ('rajasthan-royals', 'Rajasthan Royal Circuit', 'Jaipur · Udaipur · Jodhpur', 7, 44999, 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200', ARRAY['Heritage hotels','Amber Fort','Lake Pichola boat','Private guide'], 30),
  ('kashmir-paradise', 'Kashmir Paradise', 'Srinagar · Gulmarg · Pahalgam', 6, 38999, 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=1200', ARRAY['Dal Lake shikara','Gulmarg gondola','Betaab Valley','Deluxe houseboat'], 40),
  ('himachal-hills', 'Himachal Hills Retreat', 'Shimla · Manali', 5, 24999, 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200', ARRAY['Solang Valley','Rohtang permit','Mall Road stay','Snow-point taxi'], 50),
  ('ladakh-adventure', 'Ladakh High Adventure', 'Leh · Nubra · Pangong', 7, 49999, 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=1200', ARRAY['Pangong lake stay','Nubra camels','Khardung La','Oxygen support'], 60),
  ('andaman-islands', 'Andaman Islands', 'Port Blair · Havelock · Neil', 6, 42999, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', ARRAY['Scuba dive','Radhanagar beach','Glass boat ride','Island transfers'], 70),
  ('northeast-explorer', 'Northeast Explorer', 'Meghalaya · Assam', 6, 34999, 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1200', ARRAY['Living root bridges','Cherrapunji falls','Kaziranga safari','English-speaking guide'], 80);
