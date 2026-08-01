-- 1) order_status_history: remove public read/insert
DROP POLICY IF EXISTS "anyone can view status history" ON public.order_status_history;
DROP POLICY IF EXISTS "anyone can insert status history" ON public.order_status_history;

CREATE POLICY "Owners and admins can view status history"
ON public.order_status_history FOR SELECT TO authenticated
USING (
  is_admin_user(auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid())
);

CREATE POLICY "Owners and admins can insert status history"
ON public.order_status_history FOR INSERT TO authenticated
WITH CHECK (
  is_admin_user(auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid())
);

REVOKE ALL ON public.order_status_history FROM anon;
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;

-- 2) slip_verifications: drop the blanket guest-order read
DROP POLICY IF EXISTS "Guests can view slip verifications for guest orders" ON public.slip_verifications;
REVOKE ALL ON public.slip_verifications FROM anon;
GRANT SELECT ON public.slip_verifications TO authenticated;
GRANT ALL ON public.slip_verifications TO service_role;

-- 3) price_audit_log: admin only
DROP POLICY IF EXISTS "Anyone can view audit log" ON public.price_audit_log;
DROP POLICY IF EXISTS "Anyone can insert audit log" ON public.price_audit_log;

CREATE POLICY "Admins can view audit log"
ON public.price_audit_log FOR SELECT TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert audit log"
ON public.price_audit_log FOR INSERT TO authenticated
WITH CHECK (is_admin_user(auth.uid()));

REVOKE ALL ON public.price_audit_log FROM anon;
GRANT SELECT, INSERT ON public.price_audit_log TO authenticated;
GRANT ALL ON public.price_audit_log TO service_role;