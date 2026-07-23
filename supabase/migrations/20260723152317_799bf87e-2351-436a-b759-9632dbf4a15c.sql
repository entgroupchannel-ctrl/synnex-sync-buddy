
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
CREATE POLICY "anyone can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "authenticated can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
