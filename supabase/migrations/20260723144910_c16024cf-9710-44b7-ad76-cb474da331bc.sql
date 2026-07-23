GRANT SELECT ON public.synnex_products TO anon;
CREATE POLICY "public read products" ON public.synnex_products FOR SELECT TO anon USING (true);