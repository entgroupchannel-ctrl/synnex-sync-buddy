-- Grants + RLS for pricing_rules
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_rules TO authenticated;
GRANT ALL ON public.pricing_rules TO service_role;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated manage pricing rules" ON public.pricing_rules;
CREATE POLICY "authenticated manage pricing rules" ON public.pricing_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure updated_at trigger
DROP TRIGGER IF EXISTS pricing_rules_updated_at ON public.pricing_rules;
CREATE TRIGGER pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a default global rule if none exists
INSERT INTO public.pricing_rules (rule_name, rule_type, target, markup_percent, is_active)
SELECT 'Global markup', 'global', NULL, 15, true
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE rule_type = 'global');

-- Allow authenticated to update synnex_products (for pricing edits)
DROP POLICY IF EXISTS "authenticated update products" ON public.synnex_products;
CREATE POLICY "authenticated update products" ON public.synnex_products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
GRANT UPDATE ON public.synnex_products TO authenticated;