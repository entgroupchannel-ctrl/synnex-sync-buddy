CREATE TABLE IF NOT EXISTS public.price_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_sku text not null,
  product_name text,
  action text not null,
  old_selling_price numeric,
  new_selling_price numeric,
  old_markup numeric,
  new_markup numeric,
  approved_by text,
  session_id text,
  notes text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_audit_log TO anon, authenticated;
GRANT ALL ON public.price_audit_log TO service_role;

ALTER TABLE public.price_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audit log"
  ON public.price_audit_log FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert audit log"
  ON public.price_audit_log FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_price_audit_log_created_at ON public.price_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_audit_log_session ON public.price_audit_log (session_id);
CREATE INDEX IF NOT EXISTS idx_price_audit_log_sku ON public.price_audit_log (product_sku);