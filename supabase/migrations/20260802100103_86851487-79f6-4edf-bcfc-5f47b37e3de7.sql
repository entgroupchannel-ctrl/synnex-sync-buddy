CREATE OR REPLACE FUNCTION public.get_order_confirmation(p_order_number text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(x) FROM (
    SELECT o.id, o.order_number, o.created_at, o.customer_name, o.customer_phone,
           o.customer_email, o.customer_type, o.user_id,
           o.shipping_name, o.shipping_phone, o.shipping_address, o.shipping_district,
           o.shipping_province, o.shipping_postcode,
           o.payment_method, o.payment_status, o.payment_slip_url,
           o.subtotal, o.cod_fee, o.total, o.status,
           o.need_tax_invoice, o.company_name,
           COALESCE((
             SELECT jsonb_agg(jsonb_build_object(
               'id', i.id,
               'product_sku', i.product_sku,
               'product_name', i.product_name,
               'product_image_url', i.product_image_url,
               'unit_price', i.unit_price,
               'quantity', i.quantity,
               'subtotal', i.subtotal
             ) ORDER BY i.id)
             FROM public.order_items i WHERE i.order_id = o.id
           ), '[]'::jsonb) AS order_items
    FROM public.orders o
    WHERE o.order_number = p_order_number
    LIMIT 1
  ) x;
$$;

REVOKE ALL ON FUNCTION public.get_order_confirmation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_confirmation(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_order_payment_status(p_order_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.payment_status FROM public.orders o WHERE o.id = p_order_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_order_payment_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_payment_status(uuid) TO anon, authenticated, service_role;