
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  email_type text,
  recipient text,
  subject text,
  status text DEFAULT 'sent',
  resend_message_id text,
  error_message text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_logs readable by authenticated"
  ON public.email_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "email_logs insert by authenticated"
  ON public.email_logs FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quotation_url text,
  ADD COLUMN IF NOT EXISTS tax_invoice_url text,
  ADD COLUMN IF NOT EXISTS tracking_number text;

CREATE POLICY "docs authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('quotations', 'tax-invoices', 'delivery-notes'));

CREATE POLICY "docs authenticated insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('quotations', 'tax-invoices', 'delivery-notes'));

CREATE POLICY "docs authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('quotations', 'tax-invoices', 'delivery-notes'));
