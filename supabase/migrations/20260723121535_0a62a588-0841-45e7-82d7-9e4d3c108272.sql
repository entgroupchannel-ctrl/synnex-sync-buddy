CREATE TABLE public.synnex_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text,
  price numeric,
  stock text,
  image_url text,
  brand text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.synnex_products TO authenticated, anon;
GRANT ALL ON public.synnex_products TO service_role;
ALTER TABLE public.synnex_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read products" ON public.synnex_products FOR SELECT USING (true);

CREATE TABLE public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  products_found int NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('success','error','running')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sync_logs TO authenticated, anon;
GRANT ALL ON public.sync_logs TO service_role;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read logs" ON public.sync_logs FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_synnex_products_updated BEFORE UPDATE ON public.synnex_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_synnex_products_sku ON public.synnex_products(sku);
CREATE INDEX idx_synnex_products_name ON public.synnex_products USING gin (to_tsvector('simple', coalesce(name,'')));
CREATE INDEX idx_sync_logs_started ON public.sync_logs(started_at DESC);