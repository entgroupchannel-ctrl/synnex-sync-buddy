CREATE TABLE IF NOT EXISTS public.credit_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  company_name text NOT NULL,
  tax_id text NOT NULL,
  company_type text,
  company_address text NOT NULL,
  company_phone text NOT NULL,
  company_email text NOT NULL,
  website text,
  contact_name text NOT NULL,
  contact_position text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  requested_credit_limit numeric NOT NULL DEFAULT 0,
  annual_revenue text,
  years_in_business text,
  company_registration_url text,
  vat_certificate_url text,
  financial_statement_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected','suspended')),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  admin_note text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  application_number text UNIQUE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_applications TO authenticated;
GRANT ALL ON public.credit_applications TO service_role;
ALTER TABLE public.credit_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.credit_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  tax_id text NOT NULL,
  credit_limit numeric NOT NULL DEFAULT 0,
  credit_used numeric NOT NULL DEFAULT 0,
  credit_available numeric GENERATED ALWAYS AS (credit_limit - credit_used) STORED,
  payment_terms_days integer NOT NULL DEFAULT 30,
  interest_rate numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  suspended_reason text,
  application_id uuid REFERENCES public.credit_applications(id) ON DELETE SET NULL,
  approved_by text,
  approved_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '1 year')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_accounts TO authenticated;
GRANT ALL ON public.credit_accounts TO service_role;
ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  credit_account_id uuid REFERENCES public.credit_accounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  type text CHECK (type IN ('purchase','payment','adjustment','refund')),
  amount numeric NOT NULL,
  balance_before numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  due_date timestamptz,
  paid_at timestamptz,
  reference text,
  note text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
    NEW.application_number := 'CRA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_application_number ON public.credit_applications;
CREATE TRIGGER set_application_number
  BEFORE INSERT ON public.credit_applications
  FOR EACH ROW EXECUTE FUNCTION public.generate_application_number();

CREATE OR REPLACE FUNCTION public.update_credit_used()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _acc uuid := COALESCE(NEW.credit_account_id, OLD.credit_account_id);
BEGIN
  IF _acc IS NOT NULL THEN
    UPDATE public.credit_accounts
    SET credit_used = COALESCE((
      SELECT SUM(CASE WHEN type = 'purchase' THEN amount
                      WHEN type IN ('payment','refund') THEN -amount
                      ELSE 0 END)
      FROM public.credit_transactions
      WHERE credit_account_id = _acc
    ), 0)
    WHERE id = _acc;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_credit_used ON public.credit_transactions;
CREATE TRIGGER trigger_update_credit_used
  AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_credit_used();

CREATE OR REPLACE FUNCTION public.is_admin_user(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = _uid AND is_admin = true);
$$;

CREATE POLICY "Users see own applications" ON public.credit_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can apply" ON public.credit_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access applications" ON public.credit_applications FOR ALL TO authenticated USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Users see own credit account" ON public.credit_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin full access credit accounts" ON public.credit_accounts FOR ALL TO authenticated USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Users see own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin full access transactions" ON public.credit_transactions FOR ALL TO authenticated USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_due_date timestamptz;