
GRANT INSERT ON public.quotation_requests TO anon, authenticated;
GRANT SELECT ON public.quotation_requests TO authenticated;
GRANT ALL ON public.quotation_requests TO service_role;

CREATE POLICY "Anyone can submit a quotation request"
ON public.quotation_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own quotation requests"
ON public.quotation_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
