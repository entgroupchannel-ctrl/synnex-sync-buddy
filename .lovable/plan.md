## ยืนยันปัญหาแล้ว

ตรวจ environment ของ server runtime ในโปรเจกต์นี้:
- `SUPABASE_URL` — มีค่า
- `SUPABASE_PUBLISHABLE_KEY` — มีค่า
- `SUPABASE_SERVICE_ROLE_KEY` — **ว่าง**

ฉะนั้น `supabaseAdmin` ใน `src/integrations/supabase/client.server.ts` จะ throw `Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY` ทุกครั้งที่ server function เรียกใช้ (เช่น `admin-guard.server.ts`, `pricing-admin.server.ts`) การเชื่อมต่อ Supabase ตัวอื่นยังปกติ — ขาดแค่ service role key

## แผนการแก้

1. เรียกเครื่องมือ re-bind ของ Supabase integration เพื่อดึง service-role key ตัวจริงจาก Supabase management API มาผูกใหม่ และรีเฟรช env (`SUPABASE_URL`, publishable key, service role key) — ไม่ rotate key ไม่กระทบ key เดิม
2. ตรวจซ้ำว่า `SUPABASE_SERVICE_ROLE_KEY` มีค่าแล้ว (ไม่แสดงค่าออกมา)
3. ถ้า env ยังไม่มา ให้ restart dev server แล้วตรวจอีกครั้ง
4. ทดสอบเส้นทางที่ใช้ `supabaseAdmin` จริง (เรียก server function ฝั่ง admin เช่นหน้า `/admin/pricing/products`) เพื่อยืนยันว่าไม่ throw แล้ว

## หมายเหตุ

- ไม่ต้องแก้โค้ดใด ๆ และจะไม่ลดสิทธิ์จาก service role ไปเป็น client แบบ RLS เพื่อเลี่ยงปัญหา
- ถ้า re-bind ล้มเหลว แปลว่า authorization ของ Supabase ระดับ workspace ถูกถอน — กรณีนั้นต้อง reconnect Supabase ใน Project Settings (ผมจะแจ้งชัดเจน) ไม่ต้องส่ง service-role key มาให้ผมเอง
