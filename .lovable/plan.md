## สาเหตุ (ยืนยันจาก production แล้ว)

ทดสอบเปิด `https://shop.entgroup.co.th/order/ENT-20260802-292E8F` ด้วยเบราว์เซอร์จริง: หน้าเว็บ **ขาว/โหลดค้าง** และ server function ตอบกลับว่า

```text
Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY.
```

- ออเดอร์สร้างสำเร็จจริง (ตรวจในฐานข้อมูล: ล่าสุด `ENT-20260802-292E8F`, `payment_method = promptpay`, `payment_status = pending`)
- แต่หน้า `/order/$orderNumber` ดึงข้อมูลผ่าน `getOrderConfirmation` ซึ่งใช้ admin client → พังเพราะ service role key หายจาก environment ฝั่ง production
- โมดัล PromptPay ถูก render **หลัง** ได้ข้อมูลออเดอร์ (`order.payment_method === "promptpay"`) จึงไม่มี QR ให้สแกน — ไม่ใช่บั๊กที่โค้ด QR (bundle มีตัวสร้าง payload ครบ)

## สิ่งที่จะทำ

1. **Rebind Supabase secrets** ใหม่ (`SUPABASE_SERVICE_ROLE_KEY` หายซ้ำรอบที่ 3) แล้วต้อง **Publish** เพื่อให้ production โหลดค่าใหม่

2. **ทำหน้าออเดอร์ไม่ให้ล้มทั้งหน้าเมื่อ admin client ใช้ไม่ได้** — ใน `src/lib/order-confirmation.functions.ts` ให้ `getOrderConfirmation` มี fallback: ถ้าไม่มี service role key ให้อ่านผ่าน publishable client ตาม RLS (เจ้าของออเดอร์ / guest ผ่าน order_number + email เดิมที่ใช้อยู่) แทนการ throw ทันที

3. **แยก QR ออกจาก data fetch** — ให้หน้า `/order/$orderNumber` แสดงกล่อง QR PromptPay ได้จากข้อมูลที่มีอยู่แล้ว (เลขออเดอร์ + ยอดเงิน) แม้ query รายละเอียดออเดอร์จะล้ม พร้อมปุ่ม "ลองโหลดใหม่" และข้อความ error ที่อ่านรู้เรื่อง แทนหน้าขาว

4. **แจ้งเตือนล่วงหน้า** — ต่อยอด `secrets-health.functions.ts` ที่มีอยู่: เพิ่มการเช็ค service role key แบบ runtime บนหน้า order/checkout (เงียบสำหรับลูกค้า, log ให้แอดมิน) เพื่อจับเคสคีย์หายได้ก่อนลูกค้าเจอ

5. ทดสอบซ้ำด้วยเบราว์เซอร์จริงหลัง publish: ยืนยันว่าหน้าออเดอร์แสดงรายละเอียด + QR ขึ้นให้สแกน

## หมายเหตุทางเทคนิค

ต้นเหตุคือ environment ฝั่ง deploy ไม่ใช่ code ดังนั้นข้อ 1 คือสิ่งที่ทำให้ใช้งานได้ทันที ข้อ 2–4 คือกันไม่ให้อาการเดิม (หน้าขาว/จ่ายเงินไม่ได้) กลับมาอีกถ้า secret หายซ้ำ