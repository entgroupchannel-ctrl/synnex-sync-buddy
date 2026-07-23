-- User profiles
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL DEFAULT 'b2c' CHECK (user_type IN ('b2c','b2b')),
  full_name text,
  phone text,
  company_name text,
  tax_id text,
  company_address text,
  position text,
  wants_tax_invoice boolean DEFAULT false,
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','pending_approval','rejected','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "authenticated read all profiles admin" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated update profiles admin" ON public.user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Addresses
CREATE TABLE public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text DEFAULT 'บ้าน',
  recipient text,
  phone text,
  address_line text,
  district text,
  province text,
  postcode text,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_addresses TO authenticated;
GRANT ALL ON public.user_addresses TO service_role;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own addresses" ON public.user_addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_user_addresses_updated_at BEFORE UPDATE ON public.user_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, user_type, full_name, phone, company_name, tax_id, company_address, position, wants_tax_invoice, account_status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'b2c'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'tax_id',
    NEW.raw_user_meta_data->>'company_address',
    NEW.raw_user_meta_data->>'position',
    COALESCE((NEW.raw_user_meta_data->>'wants_tax_invoice')::boolean, false),
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'user_type','b2c') = 'b2b' THEN 'pending_approval' ELSE 'active' END
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Extend orders for guest + tax invoice + payment method
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_type text DEFAULT 'guest';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_guest boolean DEFAULT true;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_invoice jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'transfer';
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(customer_email);
CREATE POLICY "users read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());