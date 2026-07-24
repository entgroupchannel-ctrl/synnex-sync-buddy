ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'footer',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscribed_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);

GRANT SELECT, INSERT, UPDATE ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can resubscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can resubscribe" ON public.newsletter_subscribers
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can count subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can count subscribers" ON public.newsletter_subscribers
  FOR SELECT TO anon, authenticated USING (true);