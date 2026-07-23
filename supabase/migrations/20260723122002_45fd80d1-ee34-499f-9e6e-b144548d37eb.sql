
ALTER TABLE public.synnex_products
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS stock_qty integer,
  ADD COLUMN IF NOT EXISTS stock_status text,
  ADD COLUMN IF NOT EXISTS product_url text;

-- Tighten read access to authenticated users only
DROP POLICY IF EXISTS "public read products" ON public.synnex_products;
DROP POLICY IF EXISTS "public read logs" ON public.sync_logs;

CREATE POLICY "authenticated read products"
  ON public.synnex_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated read logs"
  ON public.sync_logs FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.synnex_products FROM anon;
REVOKE SELECT ON public.sync_logs FROM anon;
GRANT SELECT ON public.synnex_products TO authenticated;
GRANT SELECT ON public.sync_logs TO authenticated;
