ALTER TABLE public.coupons ALTER COLUMN lead_id DROP NOT NULL;
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS max_uses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_fare numeric NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_unique ON public.coupons (upper(code));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_pct integer,
  ADD COLUMN IF NOT EXISTS discount_amount numeric,
  ADD COLUMN IF NOT EXISTS final_fare numeric;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _fare numeric)
RETURNS TABLE(valid boolean, code text, discount_pct integer, discount_amount numeric, final_fare numeric, reason text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c public.coupons%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(coupons.code) = upper(trim(_code)) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, upper(trim(_code)), 0, 0::numeric, _fare, 'Coupon not found'; RETURN;
  END IF;
  IF NOT c.active THEN
    RETURN QUERY SELECT false, c.code, 0, 0::numeric, _fare, 'Coupon is no longer active'; RETURN;
  END IF;
  IF c.valid_until < current_date THEN
    RETURN QUERY SELECT false, c.code, 0, 0::numeric, _fare, 'Coupon has expired'; RETURN;
  END IF;
  IF c.max_uses > 0 AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT false, c.code, 0, 0::numeric, _fare, 'Coupon usage limit reached'; RETURN;
  END IF;
  IF _fare < c.min_fare THEN
    RETURN QUERY SELECT false, c.code, 0, 0::numeric, _fare,
      'Minimum fare for this coupon is ' || c.min_fare::text; RETURN;
  END IF;
  RETURN QUERY SELECT true, c.code, c.discount_pct,
    round(_fare * c.discount_pct / 100.0)::numeric,
    (_fare - round(_fare * c.discount_pct / 100.0))::numeric,
    NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated, service_role;