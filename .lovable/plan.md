## สาเหตุที่พบ (ยืนยันจาก log จริง)

Log ของเว็บจริง (shop.entgroup.co.th) เวลา 06:00 วันนี้:

```text
[error] [Supabase] Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY
[request] POST https://shop.entgroup.co.th/_serverFn/... → 200
```

ตอนกด "ยืนยันคำสั่งซื้อ" ระบบทำ 3 ขั้นตามลำดับ:
1. `insert` ตาราง `orders` (ผ่าน — RLS อนุญาต)
2. `insertOrderItems` (server function ใช้ service role) ← **พังที่นี่**
3. `logOrderCreated` (server function ใช้ service role) ← พังเช่นกัน

ขั้นที่ 2 เป็น `await` และ throw error ทันที ทำให้ตกไปที่ catch แสดง toast error และไม่พาไปหน้าชำระเงิน (PromptPay/บัตร) เลย — ผลคือ "กดจ่ายเงินไม่ได้" แต่มีออเดอร์ค้างในระบบที่ไม่มีรายการสินค้า

สาเหตุคือคีย์ `SUPABASE_SERVICE_ROLE_KEY` ที่ผูกกับ worker ของเว็บ production ว่างอยู่ (ที่ผูกกลับไปก่อนหน้านี้มีผลกับ sandbox/preview เท่านั้น ยังไม่ได้ deploy ค่าใหม่ขึ้น production)

ปัญหารองที่เจอเพิ่ม:
- `cart_reminders` เปิด RLS แต่ **ไม่มี policy เลย** → เรียกจากเบราว์เซอร์ได้ 403 (ตรงกับ log) กระทบเฉพาะฟีเจอร์เตือนตะกร้า ไม่ได้บล็อกการจ่ายเงิน
- `credit_transactions` ไม่มี INSERT policy สำหรับลูกค้า → การซื้อด้วยวงเงินเครดิตจะบันทึกรายการหนี้ไม่สำเร็จ (โค้ดแค่ warn เงียบ ๆ)
- รูปจาก `dealerapi.synnex.co.th` ถูกบล็อก CORS — เป็นเรื่องรูปภาพ ไม่เกี่ยวกับการจ่ายเงิน

## แผนการแก้

### 1. คืนค่า service role key ให้เว็บ production
- ผูกค่า Supabase ใหม่ (rebind) แล้ว publish ซ้ำเพื่อให้ worker ของ production ได้คีย์
- ทดสอบยิง server function ของออเดอร์บน URL production แล้วอ่าน log ยืนยันว่าไม่มีข้อความ Missing แล้ว

### 2. ทำให้ checkout ไม่พังทั้งกระบวนการเมื่อขั้นตอนเสริมล้ม
- ถ้า `insertOrderItems` ล้ม: ยกเลิก/ทำเครื่องหมายออเดอร์ที่เพิ่งสร้าง ไม่ปล่อยออเดอร์เปล่าไว้ และแจ้งข้อความที่บอกสาเหตุชัดเจน
- `logOrderCreated` เปลี่ยนเป็น fire-and-forget (log ประวัติสถานะไม่ควรบล็อกการซื้อ)
- server function ที่ใช้ service role: ถ้าคีย์หาย ให้คืน error ที่อ่านรู้เรื่อง แทน error ดิบ

### 3. เพิ่ม RLS policy ที่ขาด (migration)
- `cart_reminders`: ให้ผู้ใช้ที่ล็อกอินอ่าน/เพิ่ม/แก้/ลบเฉพาะแถวของตัวเอง (`auth.uid() = user_id`) + GRANT ให้ `authenticated` และ `service_role`
- `credit_transactions`: ให้ลูกค้าเพิ่มรายการประเภท `purchase` ของตัวเองได้ (หรือย้ายไปทำผ่าน server function ที่ใช้ service role — จะเลือกทางที่ปลอดภัยกว่าคือ server function)

### 4. ทดสอบจริง
- ทำ checkout ครบรอบทั้งแบบ guest และแบบล็อกอิน: โอนเงิน/PromptPay และบัตรเครดิต
- ตรวจว่ามี `order_items` ครบ, ไปหน้า `/order/:orderNumber` ได้, ไม่มี 403 ใน console

## หมายเหตุทางเทคนิค
ไฟล์ที่จะแตะ: `src/routes/checkout.tsx`, `src/lib/order-items.functions.ts`, `src/lib/order-confirmation.functions.ts`, `src/integrations/supabase/client.server.ts` (ข้อความ error) และ migration ใหม่สำหรับ policy/grant ของ `cart_reminders` + การจัดการ `credit_transactions`
