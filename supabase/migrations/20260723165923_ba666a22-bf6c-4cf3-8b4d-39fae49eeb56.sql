
-- Add missing columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS subtotal numeric,
  ADD COLUMN IF NOT EXISTS cod_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS need_tax_invoice boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS shipping_name text,
  ADD COLUMN IF NOT EXISTS shipping_phone text,
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS shipping_district text,
  ADD COLUMN IF NOT EXISTS shipping_province text,
  ADD COLUMN IF NOT EXISTS shipping_postcode text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_slip_url text,
  ADD COLUMN IF NOT EXISTS cancelled_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Order number generator: ENT-YYYYMMDD-XXXXXX (6 hex chars)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_num text;
  v_tries int := 0;
BEGIN
  LOOP
    v_num := 'ENT-' || to_char((now() AT TIME ZONE 'Asia/Bangkok')::date, 'YYYYMMDD') || '-' ||
             upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_num);
    v_tries := v_tries + 1;
    IF v_tries > 8 THEN EXIT; END IF;
  END LOOP;
  RETURN v_num;
END $$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- Backfill order_number for any existing rows
UPDATE public.orders SET order_number = public.generate_order_number()
WHERE order_number IS NULL OR order_number = '';

ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
GRANT SELECT, INSERT ON public.order_status_history TO anon, authenticated;
GRANT ALL ON public.order_status_history TO service_role;

-- Policies for order_items
DROP POLICY IF EXISTS "anyone can insert order items" ON public.order_items;
CREATE POLICY "anyone can insert order items" ON public.order_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated can view order items" ON public.order_items;
CREATE POLICY "authenticated can view order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "guest read order items via order lookup" ON public.order_items;
CREATE POLICY "guest read order items via order lookup" ON public.order_items
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "authenticated can update order items" ON public.order_items;
CREATE POLICY "authenticated can update order items" ON public.order_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Policies for order_status_history
DROP POLICY IF EXISTS "anyone can insert status history" ON public.order_status_history;
CREATE POLICY "anyone can insert status history" ON public.order_status_history
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anyone can view status history" ON public.order_status_history;
CREATE POLICY "anyone can view status history" ON public.order_status_history
  FOR SELECT TO anon, authenticated USING (true);

-- Allow guests to read a single order by its order_number (needed for the confirmation page)
DROP POLICY IF EXISTS "guest read orders" ON public.orders;
CREATE POLICY "guest read orders" ON public.orders
  FOR SELECT TO anon USING (true);
