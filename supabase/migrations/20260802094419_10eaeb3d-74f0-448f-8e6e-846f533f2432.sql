CREATE OR REPLACE FUNCTION public.create_order(payload jsonb)
RETURNS TABLE (id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  INSERT INTO public.orders (
    order_number, user_id, is_guest, customer_type,
    customer_name, customer_phone, customer_email, line_id, customer_address,
    shipping_name, shipping_phone, shipping_address, shipping_district,
    shipping_province, shipping_postcode,
    shipping_method_id, shipping_method_name, shipping_provider,
    shipping_weight_kg, shipping_fee,
    discount_code, discount_code_id, discount_amount, discount,
    need_tax_invoice, company_name, tax_id, company_address,
    payment_method, payment_status, subtotal, cod_fee, total, status, notes
  ) VALUES (
    '',
    v_uid,
    v_uid IS NULL,
    COALESCE(payload->>'customer_type', 'b2c'),
    payload->>'customer_name',
    payload->>'customer_phone',
    payload->>'customer_email',
    payload->>'line_id',
    payload->>'customer_address',
    payload->>'shipping_name',
    payload->>'shipping_phone',
    payload->>'shipping_address',
    payload->>'shipping_district',
    payload->>'shipping_province',
    payload->>'shipping_postcode',
    NULLIF(payload->>'shipping_method_id','')::uuid,
    payload->>'shipping_method_name',
    payload->>'shipping_provider',
    COALESCE((payload->>'shipping_weight_kg')::numeric, 0),
    COALESCE((payload->>'shipping_fee')::numeric, 0),
    payload->>'discount_code',
    NULLIF(payload->>'discount_code_id','')::uuid,
    COALESCE((payload->>'discount_amount')::numeric, 0),
    COALESCE((payload->>'discount')::numeric, 0),
    COALESCE((payload->>'need_tax_invoice')::boolean, false),
    payload->>'company_name',
    payload->>'tax_id',
    payload->>'company_address',
    COALESCE(payload->>'payment_method', 'transfer'),
    COALESCE(payload->>'payment_status', 'pending'),
    COALESCE((payload->>'subtotal')::numeric, 0),
    COALESCE((payload->>'cod_fee')::numeric, 0),
    COALESCE((payload->>'total')::numeric, 0),
    'pending',
    payload->>'notes'
  )
  RETURNING orders.id, orders.order_number INTO id, order_number;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order(jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cancel_own_order(p_order_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  UPDATE public.orders o
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_reason = COALESCE(p_reason, 'ระบบยกเลิกอัตโนมัติ'),
      admin_notes = COALESCE(p_reason, 'ระบบยกเลิกอัตโนมัติ')
  WHERE o.id = p_order_id
    AND o.status = 'pending'
    AND o.created_at > now() - interval '30 minutes'
    AND (v_uid IS NULL OR o.user_id IS NULL OR o.user_id = v_uid)
    AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_own_order(uuid, text) TO anon, authenticated, service_role;