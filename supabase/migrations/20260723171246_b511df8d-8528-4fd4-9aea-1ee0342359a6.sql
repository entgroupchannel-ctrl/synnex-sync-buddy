
-- Remove the buggy set_order_number trigger which calls generate_order_number() as scalar (it is a trigger fn).
DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;

-- Also remove the redundant updated_at trigger duplicate.
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;

-- Ensure generate_order_number trigger handles empty string too.
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ENT-' ||
      to_char(now(), 'YYYYMMDD') || '-' ||
      upper(substr(NEW.id::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$function$;
