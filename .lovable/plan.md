## เป้าหมาย
แก้ dialog ที่ปรากฏตอนกด "ใส่ตะกร้า" ให้อยู่กึ่งกลางจอ แทนที่จะเลื่อนขึ้นมาจากด้านล่าง

## สาเหตุปัจจุบัน
- `src/components/add-to-cart-sheet.tsx` ใช้ `<Sheet side="bottom">` ทำให้ panel ติดขอบล่าง
- ตาม screenshot ที่แนบมา เนื้อหาของ dialog ถูกตัด/ดูอึดอัดเมื่ออยู่ด้านล่าง

## แผนการแก้ไข
1. แก้ไข `src/components/add-to-cart-sheet.tsx`
   - เปลี่ยน import จาก `Sheet`, `SheetContent` เป็น `Dialog`, `DialogContent` (จาก `@/components/ui/dialog`)
   - เปลี่ยนโครงสร้าง JSX จาก `<Sheet><SheetContent>...</SheetContent></Sheet>` เป็น `<Dialog><DialogContent>...</DialogContent></Dialog>`
   - เก็บ props `open` / `onOpenChange` ไว้เหมือนเดิม
   - ปรับ className ของ content ให้เป็น dialog กลางจอ พร้อม rounded-2xl และ border-top สี brand-green คงเดิม
   - ลบปุ่มปิด custom ด้านใน (ใช้ DialogPrimitive.Close ที่มากับ DialogContent ได้เลย) หรือเก็บไว้ก็ได้ถ้าต้องการปิดแบบเดิม
   - รักษาเนื้อหาและลิงก์ทั้งหมดไม่ให้เปลี่ยน

2. ตรวจสอบการใช้งาน
   - รัน type-check (`tsgo --noEmit` หรือ `bunx tsc --noEmit`)
   - รัน regression tests ที่มีอยู่
   - ใช้ Playwright เปิดหน้าแรก กด "ใส่ตะกร้า" ตรวจสอบว่า dialog อยู่กึ่งกลางจอและปิดได้

## ขอบเขต
- ไม่เปลี่ยน logic ของ `useAuthSheetListener` หรือ `triggerAuthPrompt`
- ไม่เปลี่ยนเนื้อหา/ข้อความภายใน dialog
- ไม่กระทบ flow อื่น เช่น ตะกร้า หรือหน้า auth