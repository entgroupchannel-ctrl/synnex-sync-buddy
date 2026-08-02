-- cart_reminders: RLS เปิดอยู่แต่ไม่มี policy เลย ทำให้เบราว์เซอร์ได้ 403
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_reminders TO authenticated;
GRANT ALL ON public.cart_reminders TO service_role;

DROP POLICY IF EXISTS "users manage own cart reminders" ON public.cart_reminders;
CREATE POLICY "users manage own cart reminders"
ON public.cart_reminders
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- credit_transactions: ลูกค้าต้องบันทึกรายการซื้อของตัวเองได้
GRANT SELECT, INSERT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;

DROP POLICY IF EXISTS "users insert own purchase transactions" ON public.credit_transactions;
CREATE POLICY "users insert own purchase transactions"
ON public.credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND type = 'purchase'
  AND EXISTS (
    SELECT 1 FROM public.credit_accounts ca
    WHERE ca.id = credit_transactions.credit_account_id
      AND ca.user_id = auth.uid()
  )
);