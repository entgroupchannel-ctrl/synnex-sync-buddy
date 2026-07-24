ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE public.user_profiles SET is_admin = true
WHERE id IN (SELECT id FROM auth.users WHERE lower(email) = 'therdpoom@entgroup.co.th');