ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS total_orders integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.recompute_user_order_stats(_uid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.user_profiles
  SET total_orders = COALESCE((SELECT COUNT(*) FROM public.orders WHERE user_id = _uid AND COALESCE(status,'') <> 'cancelled'), 0),
      total_spent  = COALESCE((SELECT SUM(total) FROM public.orders WHERE user_id = _uid AND COALESCE(status,'') <> 'cancelled'), 0)
  WHERE id = _uid;
$$;

CREATE OR REPLACE FUNCTION public.orders_recompute_stats_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id IS NOT NULL THEN PERFORM public.recompute_user_order_stats(OLD.user_id); END IF;
    RETURN OLD;
  ELSE
    IF NEW.user_id IS NOT NULL THEN PERFORM public.recompute_user_order_stats(NEW.user_id); END IF;
    IF TG_OP = 'UPDATE' AND OLD.user_id IS NOT NULL AND OLD.user_id <> NEW.user_id THEN
      PERFORM public.recompute_user_order_stats(OLD.user_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_recompute_stats ON public.orders;
CREATE TRIGGER trg_orders_recompute_stats
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.orders_recompute_stats_trigger();

-- Backfill
UPDATE public.user_profiles p
SET total_orders = COALESCE(s.n, 0),
    total_spent  = COALESCE(s.t, 0)
FROM (
  SELECT user_id, COUNT(*)::int AS n, SUM(total) AS t
  FROM public.orders WHERE user_id IS NOT NULL AND COALESCE(status,'') <> 'cancelled'
  GROUP BY user_id
) s
WHERE p.id = s.user_id;