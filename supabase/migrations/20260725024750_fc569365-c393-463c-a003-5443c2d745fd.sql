CREATE POLICY "Users upload own credit docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'credit-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own credit docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'credit-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin_user(auth.uid())));