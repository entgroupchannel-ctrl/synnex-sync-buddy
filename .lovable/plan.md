## สาเหตุที่กดปุ่ม Admin แล้วช้า

ตรวจจากโค้ดจริง พบว่ากว่าหน้าจะขึ้น ต้องรอ **เรียก network 3 รอบต่อกันแบบเรียงลำดับ** ก่อนจะ render อะไรเลย:

1. `src/routes/_authenticated/route.tsx` → `supabase.auth.getUser()` (ยิงไป `/auth/v1/user` ทุกครั้ง ไม่ได้อ่าน session ในเครื่อง)
2. `src/routes/_authenticated/admin.tsx` → `supabase.auth.getUser()` **ซ้ำอีกรอบ**
3. แล้วค่อย query `user_profiles.is_admin`

ทั้งหมดอยู่ใน `beforeLoad` ซึ่งบล็อกการนำทาง และโปรเจกต์ **ไม่มี `pendingComponent` เลย** → ระหว่างรอ ผู้ใช้จึงเห็นหน้าเดิมค้างอยู่ เหมือนกดแล้วไม่ตอบสนอง

## สิ่งที่จะแก้

- เปลี่ยน `getUser()` เป็น `getSession()` (อ่าน session จาก storage ทันที ไม่ยิง network) ทั้งใน `_authenticated/route.tsx` และ `admin.tsx`
- ตัดการเช็ค auth ซ้ำใน `admin.tsx` ให้ใช้ user จาก context ของ parent แทน
- แคชผล `is_admin` ไว้ (in-memory ต่อ session) เพื่อไม่ให้ query ซ้ำทุกครั้งที่สลับหน้า admin
- เพิ่ม `pendingComponent` + `pendingMs: 0` ให้ route admin แสดง skeleton ของ sidebar/หน้า ทันทีที่กด
- เพิ่ม `preload="intent"` ให้ปุ่ม Admin เพื่อเริ่มโหลดตั้งแต่เมาส์ชี้

ไม่แตะ logic สิทธิ์ (ยังต้อง `is_admin` เท่านั้น) และไม่แตะ styling อื่น

## ปุ่มมุมขวาบนในภาพ

ค้นทั้งโปรเจกต์แล้ว **ไม่มีโค้ดใดสร้างปุ่ม/แบดจ์ลอยมุมขวาบน** (ไม่มี element `fixed top-*` นอกจาก dialog) — กล่องกรอบฟ้าที่เขียน `entgroup.co.th` พร้อมไอคอนลิงก์ เป็น overlay ของเบราว์เซอร์/ตัว preview (tooltip ตอนชี้ลิงก์หรือ popup ของ extension) ที่ทับข้อความ "By Order" ในแถบ ticker พอดี ไม่ใช่ส่วนหนึ่งของเว็บ จึงไม่ต้องแก้อะไร — ถ้าอยากยืนยัน จะเปิดหน้าเดียวกันด้วย headless browser แล้วแคปหน้าจอมาเทียบให้ดูได้
